document.addEventListener('DOMContentLoaded', (event) => {

    if (event) {
        console.info('DOM loaded');
    };

    const deleteButton = document.getElementById("deleteActivityButton")

    if (deleteButton) {
        $(document).on("click", deleteButton, function (e) {
            // click element is on entire dom so needs to make sure it's not deleting everything lol
            if (e.target.parentElement.id === 'deleteActivityButton') {
                const id = e.target.parentElement.parentElement.getAttribute('data-value')
                e.target.parentElement.parentElement.remove()

                fetch((`/profile/api/deleteActivity/${id}`), {
                    method: "DELETE",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then((response) => {
                    console.log('done')
                })
            }

           
        })
    }



})