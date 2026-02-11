// Store events array
let events = [];

function updateLocationOptions(modality) {
    const locationInput = document.getElementById('event_location');
    const locationLabel = document.querySelector('label[for="event_location"]');
    
    if (modality === 'in-person') {
        locationInput.placeholder = "Enter physical location (e.g., Room 101, 123 Main St)";
        locationInput.disabled = false;
        locationInput.required = true;
        
        if (locationLabel) {
            locationLabel.textContent = "Location*";
        }
    } else if (modality === 'remote') {
        locationInput.placeholder = "Enter virtual meeting link (e.g., Zoom, Google Meet)";
        locationInput.disabled = false;
        locationInput.required = true;
        
        if (locationLabel) {
            locationLabel.textContent = "Virtual Meeting Link*";
        }
    }
}

function saveEvent() {
    const eventIndex = document.getElementById('event_index')?.value || '';
    
    const eventName = document.getElementById('event_name').value;
    const eventWeekday = document.getElementById('event_weekday').value;
    const eventTime = document.getElementById('event_time').value;
    const eventModality = document.getElementById('event_modality').value;
    const eventCategory = document.getElementById('event_category').value;
    
    // Handle attendees
    const attendeesInput = document.getElementById('event_attendees').value;
    const attendeesList = attendeesInput ? attendeesInput.split(',').map(a => a.trim()) : [];
    
    // Get location or remote URL based on modality
    let eventLocation = null;
    let remoteUrl = null;
    
    if (eventModality === "in-person") {
        eventLocation = document.getElementById('event_location').value;
    } else {
        remoteUrl = document.getElementById('event_remote_url').value;
    }

    // Create the eventDetails object with lowercase weekday to match IDs
    const eventData = {
        name: eventName,
        weekday: eventWeekday.toLowerCase(), // Convert to lowercase for IDs
        time: eventTime,
        modality: eventModality,
        location: eventLocation,
        remote_url: remoteUrl,
        attendees: attendeesList,
        category: eventCategory
    };

    if (eventIndex === '') {
        // Add new event
        events.push(eventData);
        addEventToCalendarUI(eventData, events.length - 1);
    } else {
        // Update existing event
        events[parseInt(eventIndex)] = eventData;
        refreshCalendar();
    }

    // Reset form and close modal
    document.getElementById('event_form').reset();
    
    // Clear hidden index
    const hiddenInput = document.getElementById('event_index');
    if (hiddenInput) hiddenInput.value = '';
    
    const myModalElement = document.getElementById('event_modal');
    const myModal = bootstrap.Modal.getInstance(myModalElement);
    if (myModal) {
        myModal.hide();
    }
}

function addEventToCalendarUI(eventInfo, index) {
    let event_card = createEventCard(eventInfo, index);
    const weekday = eventInfo.weekday;
    const dayElement = document.getElementById(weekday.toLowerCase());
    dayElement.appendChild(event_card);
}

function createEventCard(eventDetails, index) {
    let event_element = document.createElement('div');
    event_element.classList = 'event row border rounded m-1 py-1';
    
    // Add category-based styling
    if (eventDetails.category === 'work') {
        event_element.classList.add('event-work');
    } else if (eventDetails.category === 'personal') {
        event_element.classList.add('event-personal');
    } else if (eventDetails.category === 'social') {
        event_element.classList.add('event-social');
    }

    // Add click event to edit the event
    event_element.addEventListener('click', function(e) {
        e.stopPropagation();
        openEditModal(index);
    });

    let info = document.createElement('div');
    info.innerHTML = `
        <p><strong>Name:</strong> ${eventDetails.name}</p>
        <p><strong>Day:</strong> ${eventDetails.weekday}</p>
        <p><strong>Time:</strong> ${eventDetails.time}</p>
        <p><strong>Modality:</strong> ${eventDetails.modality}</p>
        <p><strong>${eventDetails.modality === 'in-person' ? 'Location' : 'Meeting Link'}:</strong> 
           ${eventDetails.modality === 'in-person' ? eventDetails.location : eventDetails.remote_url}</p>
        <p><strong>Attendees:</strong> ${eventDetails.attendees ? eventDetails.attendees.length : 0}</p>
        <p><strong>Category:</strong> ${eventDetails.category}</p>
    `;
    event_element.appendChild(info);
    return event_element;
}

function openEditModal(index) {
    const event = events[index];
    console.log("Editing event:", event); // Debug log
    
    // Add hidden input for event index if it doesn't exist
    let hiddenInput = document.getElementById('event_index');
    if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'event_index';
        document.getElementById('event_form').appendChild(hiddenInput);
    }
    
    // Set the event index
    hiddenInput.value = index;
    
    // Fill form with event data
    document.getElementById('event_name').value = event.name || '';
    
    // Fix: Capitalize first letter for weekday to match select options
    const weekdayValue = event.weekday.charAt(0).toUpperCase() + event.weekday.slice(1);
    document.getElementById('event_weekday').value = weekdayValue;
    
    document.getElementById('event_time').value = event.time || '';
    document.getElementById('event_modality').value = event.modality || '';
    document.getElementById('event_category').value = event.category || '';
    
    // Trigger modality change to show correct fields
    const modalityEvent = new Event('change');
    document.getElementById('event_modality').dispatchEvent(modalityEvent);
    
    // Handle location/remote URL fields correctly
    if (event.modality === 'in-person') {
        document.getElementById('event_location').value = event.location || '';
        document.getElementById('event_remote_url').value = ''; // Clear remote field
    } else {
        document.getElementById('event_remote_url').value = event.remote_url || '';
        document.getElementById('event_location').value = ''; // Clear location field
    }
    
    // Fill attendees
    if (event.attendees && event.attendees.length > 0) {
        document.getElementById('event_attendees').value = event.attendees.join(', ');
    } else {
        document.getElementById('event_attendees').value = '';
    }
    
    // Update modal title
    document.querySelector('.modal-title').textContent = 'Edit Event';
    
    // Show the modal
    const myModalElement = document.getElementById('event_modal');
    const myModal = bootstrap.Modal.getOrCreateInstance(myModalElement);
    myModal.show();
}

function refreshCalendar() {
    // Clear all day containers
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    weekdays.forEach(day => {
        const container = document.getElementById(day);
        if (container) {
            // Remove all event cards but keep the day header
            const children = container.children;
            for (let i = children.length - 1; i >= 0; i--) {
                if (children[i].classList.contains('event')) {
                    children[i].remove();
                }
            }
        }
    });
    
    // Re-add all events
    events.forEach((event, index) => {
        const dayElement = document.getElementById(event.weekday.toLowerCase());
        if (dayElement) {
            const eventCard = createEventCard(event, index);
            dayElement.appendChild(eventCard);
        }
    });
}

// Initialize the modal for new events
// Initialize the modal for new events
function initNewEventModal() {
    // Reset form when modal is opened for new event
    const eventModal = document.getElementById('event_modal');
    eventModal.addEventListener('show.bs.modal', function() {
        // Only reset if we're not editing (no hidden index)
        const hiddenInput = document.getElementById('event_index');
        if (!hiddenInput || hiddenInput.value === '') {
            // Reset form
            document.getElementById('event_form').reset();
            
            // Reset modal title
            document.querySelector('.modal-title').textContent = 'Create New Event';
            
            // Set default modality
            const modalitySelect = document.getElementById('event_modality');
            modalitySelect.value = 'in-person';
            const changeEvent = new Event('change');
            modalitySelect.dispatchEvent(changeEvent);
            
            // Remove validation classes
            const formElements = document.getElementById('event_form').elements;
            Array.from(formElements).forEach(element => {
                element.classList.remove('is-invalid', 'is-valid');
            });
            document.getElementById('event_form').classList.remove('was-validated');
        }
    });
}