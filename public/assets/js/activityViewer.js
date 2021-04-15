document.addEventListener('DOMContentLoaded', (event) => {
    const activityId = document.getElementById('activityId').textContent;
    const participantList = document.getElementById('participantList');

    fetch((`/profile/GetActivity/${activityId}`), {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        },
    }).then((response) => {
        response.json().then((data) => {

            // Date and Time
            const activity_date_el = document.getElementById('activity_date_el')
            const activity_time_el = document.getElementById('activity_time_el')

            const activityDate = moment(data[0].activity_date).format("MMM DD YYYY")
            const activityTime = moment(data[0].activity_time, 'HH:mm:ss').format("hh:mm A")
            activity_date_el.textContent = activityDate;
            activity_time_el.textContent = activityTime;




            // create participant list by requesting user info from user database
            const participants = (data[0].activity_participants).split(',')
            console.log(participants)
            for (let i = 0; i < participants.length; i++) {
                fetch((`/profile/searchParticipants/${participants[i]}`), {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then((participantData) => {
                    participantData.json().then((participant) => {
                        let li = document.createElement('li');
                        let img = document.createElement('img');
                        let span = document.createElement('span');

                        li.classList.add("collection-item", "avatar", "valign-wrapper")
                        img.classList.add("circle");
                        img.setAttribute('src', participant[0].user_photo);
                        span.classList.add('title');
                        span.textContent = participant[0].user_first + " " + participant[0].user_last;
                        li.appendChild(img)
                        li.appendChild(span)
                        participantList.appendChild(li);

                    })
                })
            }

            // creating map
            const mapTest = document.getElementById('mapid');
            if (mapTest) {
                const meetingCoords = data[0].activity_meeting_location.split(",");
                var mymap = L.map('mapid').setView([+meetingCoords[0], +meetingCoords[1]], 15);
                L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 18,
                    id: 'mapbox/streets-v11',
                    tileSize: 512,
                    zoomOffset: -1,
                    // hid this!!
                    accessToken: 'pk.eyJ1IjoicGZ2YXR0ZXJvdHQiLCJhIjoiY2tsODZxOW5uMXo3ZTJ4bW1iN3YwbWpsaCJ9.LGIyO-vQru6dyenUYpZE3A'
                }).addTo(mymap);

                // marker for meeting location
                var marker = L.marker([+meetingCoords[0], +meetingCoords[1]], {
                    title: `Directions`,
                }).bindPopup(`<a class="waves-effect waves-light btn" href='http://maps.google.com/maps?daddr=${meetingCoords[0]},${meetingCoords[1]}' target="_blank">Directions</a>`).addTo(mymap)


                // requesting strava API for segment info/polylines
                const timer = ms => new Promise(res => setTimeout(res, ms))
                const activitySegments = (data[0].activity_segments).split(',')
                for (let i = 0; i < activitySegments.length; i++) {
                    setTimeout(() =>{
                        fetch((`/profile/segmentInfo/${activitySegments[i]}`), {
                            method: "GET",
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }).then((segmentData) => {
                            segmentData.json().then((segment) => {
                                // map polylines
                                var coordinates = L.Polyline.fromEncoded(segment.map.polyline).getLatLngs()
                                L.polyline(
                                    coordinates,
                                    {
                                        color: '#EBAF1A',
                                        weight: 5,
                                        opacity: .9,
                                        lineJoin: 'round',
                                    },
                                ).on('mouseover', (e) => {
                                    initialColor = e.target.options.color;
                                    e.target.setStyle({
                                        color: 'yellow'
                                    })
                                }).on('mouseout', (e) => {
                                    e.target.setStyle({
                                        color: initialColor
                                    })
                                }).bindTooltip(segment.name).addTo(mymap)
                                // creating list of segments
                                const segmentList = document.getElementById('segmentList');
                                const tr = document.createElement('tr')
                                const tdName = document.createElement('td');
                                const tdDistance = document.createElement('td');
                                const tdElevation = document.createElement('td');

                                tdName.textContent = segment.name;
                                tdDistance.textContent = ((Math.round(0.00062137 * segment.distance * 100) / 100) + " miles");
                                tdElevation.textContent = ((Math.round(segment.total_elevation_gain * 3.28084)) + " ft");
                                tr.appendChild(tdName)
                                tr.appendChild(tdDistance)
                                tr.appendChild(tdElevation)
                                segmentList.appendChild(tr);
                            })
                        })
                    }, i * 500)
                }
            }

            // get segment stream info to create chart
            const activitySegments = (data[0].activity_segments).split(',')
            let newGraphData = [];
            for (let i = 0; i < activitySegments.length; i++) {
                setTimeout(() =>{
                    fetch((`/profile/segment/${activitySegments[i]}`), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }).then((segmentStream) => {
                        segmentStream.json().then((segmentData => {
                            if (newGraphData.length > 0) {
                                const lastSegmentEndDistance = newGraphData[newGraphData.length - 1].x
                                for (let i = 0; i < segmentData[1].data.length; i++) {
                                    let xValue = (Math.round(.00062137 * segmentData[1].data[i] * 100) / 100) + lastSegmentEndDistance;
                                    newGraphData.push({ x: xValue, y: (Math.round(3.28084 * segmentData[2].data[i])) })
                                }
                            }
                            else {
                                for (let i = 0; i < segmentData[1].data.length; i++) {
                                    newGraphData.push({ x: (Math.round(.00062137 * segmentData[1].data[i] * 100) / 100), y: (Math.round(3.28084 * segmentData[2].data[i])) })
                                }
                            }
                            var chart = new CanvasJS.Chart("chartContainer", {
                                animationEnabled: true,
                                toolTip: {
                                    content: "Distance: {x} miles <br> Elevation: {y} feet"
                                },
                                axisY: {
                                    suffix: "ft",
                                    gridThickness: 0,
                                },
                                axisX: {
                                    suffix: "miles"
                                },
                                data: [{
                                    type: "splineArea",
                                    lineThickness: 3,
                                    color: "#EBAF1A",
                                    dataPoints: newGraphData,
                                    markerType: "none",
                                }]
                            });
                            chart.render();
                        }))
                    })

                    
                }, i * 500)

            }
        })
    })

});
