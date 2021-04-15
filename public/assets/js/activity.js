// const { Model } = require("sequelize/types");

// const { response } = require("express");

document.addEventListener('DOMContentLoaded', (event) => {
    const activityList = document.getElementById("activityList");
    const totalDistanceEl = document.getElementById("totalDistance");
    const totalElevationGained = document.getElementById("totalElevationGained")
    const totalElevationLost = document.getElementById("totalElevationLost")
    let totalDistance = 0;
    let activitySegments = [];
    let elevationGained = 0;
    let elevationLost = 0;
    let parkingLocation = 0;
    let listIdentifier = 0;
    let participantList = [];

   
    if (event) {
        console.info('DOM loaded');
    };

    // rounding function for distance
    function round(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    // if map present in html, create map
    const mapTest = document.getElementById('mapid');
    if (mapTest) {
        var mymap = L.map('mapid').locate({ setView: true, maxZoom: 13 });
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            // hid this!!
            accessToken: 'pk.eyJ1IjoicGZ2YXR0ZXJvdHQiLCJhIjoiY2tsODZxOW5uMXo3ZTJ4bW1iN3YwbWpsaCJ9.LGIyO-vQru6dyenUYpZE3A'
        }).addTo(mymap);


        let idList = [];
        const getSegments = (southWestLat, southWestLng, northEastLat, northEastLng) =>
            fetch((`/profile/activity/${southWestLat},${southWestLng},${northEastLat},${northEastLng}/biking`), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then((response) => {
                let bounds = mymap.getBounds()
                response.json().then((data) => {
                    for (let i = 0; i < data.segments.length; i++) {
                        if (!idList.includes(data.segments[i].id)) {
                            idList.push(data.segments[i].id)
                            var coordinates = L.Polyline.fromEncoded(data.segments[i].points).getLatLngs()
                            L.polyline(
                                coordinates,
                                {
                                    color: 'orange',
                                    weight: 5,
                                    opacity: .9,
                                    lineJoin: 'round',
                                    metaDataName: data.segments[i].name,
                                    metaDataDistance: data.segments[i].distance,
                                    metaDataElevation: data.segments[i].elev_difference,
                                    metaDataId: data.segments[i].id
                                },
                            ).on('mouseover', (e) => {
                                e.target.bringToFront();
                                initialColor = e.target.options.color;
                                e.target.setStyle({
                                    color: 'yellow'
                                })
                            }).on('mouseout', (e) => {
                                e.target.setStyle({
                                    color: initialColor
                                })
                            }).on('click', (e) => {
                                listIdentifier++

                                // Gets segment stream of coordinates, elevation, distance
                                fetch((`segment/${e.target.options.metaDataId}`), {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                }).then((segmentStream) => {
                                    segmentStream.json().then((segmentData => {
                                        activitySegments.push(e.target.options.metaDataId)
                                        createGraph(segmentData);
                                    }))
                                })

                                // Deletes the "delete" icon before adding a new row
                                const oldDeleteButton = document.getElementById("deleteButton");
                                if (oldDeleteButton) {
                                    oldDeleteButton.remove();
                                }

                                totalDistance += round(e.target.options.metaDataDistance * 0.00062137, 2)
                                totalDistanceEl.textContent = totalDistance.toFixed(2) + " miles";

                                // Create List Item on click
                                const tr = document.createElement('tr')
                                const tdName = document.createElement('td');
                                const tdDistance = document.createElement('td');
                                const tdElevation = document.createElement('td');
                                let a = document.createElement("a");
                                let i = document.createElement('i');
                                a.classList.add('hoverable', 'btn-floating', 'btn', "deleteButton")
                                a.setAttribute('data-index', listIdentifier);
                                i.classList.add("fas", "fa-trash-alt", "right");
                                a.setAttribute("id", "deleteButton");
                                a.appendChild(i);

                                tdName.textContent = e.target.options.metaDataName;
                                tdDistance.textContent = ((Math.round(0.00062137 * e.target.options.metaDataDistance * 100) / 100) + " mi");
                                tdElevation.textContent = ((Math.round(e.target.options.metaDataElevation * 3.28084)) + " ft");
                                tr.appendChild(tdName)
                                tr.appendChild(tdDistance)
                                tr.appendChild(tdElevation)
                                tr.append(a)
                                activityList.appendChild(tr);


                                // Delete Button Event Listener
                                const newDeleteButton = document.getElementById("deleteButton");
                                if (newDeleteButton) {
                                    // Grabs segment data to use for deleting graph data
                                    $(document).on("click", `[data-index=${listIdentifier}]`, function (q) {
                                        this.parentElement.remove()
                                        activitySegments.pop();
                                        fetch((`segment/${e.target.options.metaDataId}`), {
                                            method: 'GET',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                        }).then((segmentStream) => {
                                            segmentStream.json().then((segmentData => {
                                                removeGraphData(segmentData);
                                            }))
                                        });

                                        // Sets corresponding line back to orange
                                        if (e.target.options.color === 'green') {
                                            e.target.setStyle({
                                                color: 'orange'
                                            })
                                        }
                                        else {
                                            e.target.setStyle({
                                                color: 'green'
                                            })
                                        }

                                        // Adjusts total distance
                                        totalDistance -= round(e.target.options.metaDataDistance * 0.00062137, 2)
                                        if (totalDistance < 0) {
                                            totalDistance = 0;
                                        }
                                        totalDistanceEl.textContent = totalDistance.toFixed(2) + " miles";


                                        const lastListItem = activityList.lastElementChild;
                                        if (lastListItem) {
                                            let a = document.createElement("a");
                                            let i = document.createElement('i');
                                            a.classList.add('hoverable', 'btn-floating', 'btn', "deleteButton")
                                            a.setAttribute('data-index', listIdentifier - 1);
                                            i.classList.add("fas", "fa-trash-alt", "right");
                                            a.setAttribute("id", "deleteButton");
                                            a.appendChild(i);
                                            lastListItem.append(a)
                                        }
                                        q.preventDefault()
                                        q.stopPropagation();
                                        $(document).off('click', `[data-index=${listIdentifier}]`)
                                        listIdentifier--
                                    })

                                }

                                // changes line color on click
                                if (initialColor === 'orange') {
                                    e.target.setStyle({
                                        color: 'green'
                                    })
                                }
                                else if (initialColor === 'green') {
                                    e.target.setStyle({
                                        color: 'red'
                                    })
                                }
                                else {
                                    e.target.setStyle({
                                        color: 'orange'
                                    })
                                }
                                initialColor = e.target.options.color
                            }).addTo(mymap)
                            var marker = L.marker([data.segments[i].start_latlng[0], data.segments[i].start_latlng[1]], {
                                title: `${data.segments[i].name}`,
                            }).bindPopup('<b>' + data.segments[i].name + '</b> <br> Distance: ' + (Math.round(0.00062137 * data.segments[i].distance * 100) / 100) + ' miles <br> Elevation: ' + (Math.round(data.segments[i].elev_difference * 3.28084)) + " ft").addTo(mymap)
                        }
                    }
                })
            })

        mymap.on('load', () => {
            const southWestLat = mymap.getBounds()._southWest.lat;
            const southWestLng = mymap.getBounds()._southWest.lng;
            const northEastLat = mymap.getBounds()._northEast.lat;
            const northEastLng = mymap.getBounds()._northEast.lng;
            getSegments(southWestLat, southWestLng, northEastLat, northEastLng);
        })

        mymap.on('dragend', () => {
            const southWestLat = mymap.getBounds()._southWest.lat;
            const southWestLng = mymap.getBounds()._southWest.lng;
            const northEastLat = mymap.getBounds()._northEast.lat;
            const northEastLng = mymap.getBounds()._northEast.lng;
            getSegments(southWestLat, southWestLng, northEastLat, northEastLng);
        })

        var carMarker;
        mymap.on('contextmenu', function (e) {
            var popLocation = e.latlng;
            var popup = L.popup()
                .setLatLng(popLocation)
                .setContent('<a class="waves-effect waves-light btn meeting-point" style="color: white; background-color: #eb401a;" name="meeting-point" id="meeting-point">Set Meeting Point</a>')
                .openOn(mymap);
            const saveButton = document.getElementById('meeting-point')
            if (saveButton) {
                saveButton.addEventListener('click', (e) => {
                    if (mymap.hasLayer(carMarker)) {
                        mymap.removeLayer(carMarker)
                    }
                    parkingLocation = popLocation.lat.toString() + "," + popLocation.lng.toString();
                    mymap.closePopup();
                    var carIcon = L.icon({
                        iconUrl: 'https://cdn2.iconfinder.com/data/icons/map-locations-filled-pixel-perfect/64/pin-map-location-26-512.png',
                        iconSize: [40, 40]
                    })
                    carMarker = L.marker([popLocation.lat, popLocation.lng], { icon: carIcon })
                    mymap.addLayer(carMarker);

                })
            }
        });

        let newGraphData = [];
        const createGraph = (data) => {
            if (newGraphData.length > 0) {
                const lastSegmentEndDistance = newGraphData[newGraphData.length - 1].x
                for (let i = 0; i < data[1].data.length; i++) {
                    let xValue = (Math.round(.00062137 * data[1].data[i] * 100) / 100) + lastSegmentEndDistance;
                    newGraphData.push({ x: xValue, y: (Math.round(3.28084 * data[2].data[i])) })
                }
            }
            else {
                for (let i = 0; i < data[1].data.length; i++) {
                    newGraphData.push({ x: (Math.round(.00062137 * data[1].data[i] * 100) / 100), y: (Math.round(3.28084 * data[2].data[i])) })
                }
            }
            for (let i = 0; i < data[2].data.length; i++) {
                if (data[2].data[i] > data[2].data[i + 1]) {
                    elevationLost += data[2].data[i] - data[2].data[i + 1]
                }
                else if (data[2].data[i] < data[2].data[i + 1]) {
                    elevationGained += data[2].data[i + 1] - data[2].data[i]
                }
            }
            totalElevationGained.textContent = (Math.round(elevationGained * 3.28084) + " ft")
            totalElevationLost.textContent = (Math.round(elevationLost * 3.28084) + " ft")
            renderChart();
        }

        removeGraphData = (data) => {
            // removes the amount of data from the segment from the end of the graph data
            for (let i = data[1].data.length; i > 0; i--) {
                newGraphData.pop();

            }
            for (let i = 0; i < data[2].data.length; i++) {
                if (data[2].data[i] > data[2].data[i + 1]) {
                    elevationLost -= data[2].data[i] - data[2].data[i + 1]
                }
                else if (data[2].data[i] < data[2].data[i + 1]) {
                    elevationGained -= data[2].data[i + 1] - data[2].data[i]
                }
            }
            totalElevationGained.textContent = (Math.round(elevationGained * 3.28084) + " ft")
            totalElevationLost.textContent = (Math.round(elevationLost * 3.28084) + " ft")
            renderChart();
        }

        renderChart = () => {
            var chart = new CanvasJS.Chart("chartContainer", {
                animationEnabled: true,
                title: {
                },
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
        }
    }

    // friend search
    $('#friendSearch').on('click', () => {
        let searchList = document.getElementById('searchList')
        $(searchList).empty();
        const firstName = $('#first_name').val();
        const lastName = $('#last_name').val();
        fetch((`/profile/userSearch/${firstName}&${lastName}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((response) => {
            response.json().then((data) => {
                for (let q = 0; q < data.length; q++) {
                    let li = document.createElement('li');
                    let img = document.createElement('img');
                    let span = document.createElement('span');
                    let a = document.createElement("a");
                    let i = document.createElement('i');

                    // Button
                    a.classList.add('hoverable', 'btn-floating', 'btn-large', "addUser", "secondary-content")
                    i.classList.add("fas", "fa-user-plus");
                    i.setAttribute("id", "addUser");
                    i.setAttribute('data-value', data[q].user_strava_id)
                    a.appendChild(i);

                    // Create Row for each search result
                    li.classList.add("collection-item", "avatar", "valign-wrapper")
                    img.classList.add("circle");
                    img.setAttribute('src', data[q].user_photo);
                    span.classList.add('title');
                    span.textContent = data[q].user_first + " " + data[q].user_last;
                    li.appendChild(img)
                    li.appendChild(span)
                    li.appendChild(a)
                    searchList.appendChild(li);


                    $(document).on("click", `[data-value=${data[q].user_strava_id}]`, function () {
                        this.parentElement.classList.add('disabled')
                        participantList.push($(this).attr('data-value'))

                    })

                }

            })
        })
    })

    // Make sure there is a parking location before proceeding to first Modal
    const firstModalButton = document.getElementById('firstModalButton');
    firstModalButton.addEventListener('click', (e) => {
        if (parkingLocation === 0) {
            M.toast({html: 'Please pick a meeting location by right clicking on the map', classes: 'rounded'});
            function handler(e){
                e.stopPropagation();
                e.preventDefault();
            }
            handler(e)

        }
    })

    // organizing data and saving to db
    const saveActivityButton = document.getElementById('save-activity');
    const activityName = document.getElementById('activity_name');
    const user_id = document.getElementById('user_id');
    const user_strava = document.getElementById('user_strava_id');
    user_id.style.display = 'none';
    user_strava.style.display = 'none';
    if (saveActivityButton) {
        saveActivityButton.addEventListener('click', (e) => {
            if (parkingLocation === 0) {
                alert('Please pick a meeting location by right clicking on the map')
            }
            participantList.push(user_strava.textContent)
            const segmentsStringified = activitySegments.toString();
            e.preventDefault();
            const activityInfo = {
                activity_type: 'biking',
                activity_segments: segmentsStringified,
                total_distance: totalDistance,
                total_elevationGain: (Math.round(elevationGained * 3.28084)),
                total_elevationLoss: (Math.round(elevationLost * 3.28084)),
                activity_name: $('#activityName').val().trim(),
                activity_desc: $('#activityDesc').val().trim(),
                activity_date: moment($('.datepicker').val()).format('YYYY-MM-DD'),
                activity_time: moment($('.timepicker').val(), 'HH:mm a').format('HH:mm:ss'),
                activity_gear: '',
                activity_meeting_location: parkingLocation,
                activity_participants: participantList.toString(),
                userId: user_id.textContent
            }
            console.log(activityInfo)
            fetch('/profile/api/createActivity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activityInfo),
            })
        })
    }

});
