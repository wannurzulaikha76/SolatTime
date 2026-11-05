// retrieve html elements based on ID 
const reminderForm = document.getElementById('reminderForm');
const titleInput = document.getElementById('titleInput');
const timeInput = document.getElementById('timeInput');
const editIndexInput = document.getElementById('editIndex');
const submitBtn = document.getElementById('submitBtn');
const tableBody = document.getElementById('reminderTableBody');

function getReminders() {
  const data = localStorage.getItem('solatReminders'); // browser feature that allows websites to store data
  return data ? JSON.parse(data) : [ // json.parse() converts string back into js data (can use by prog). json -> js array of objects
    { title: "Perform Tahajjud Prayer", time: "Before Subuh (05:00 AM)" }, 
    { title: "Read Morning Azkar", time: "After Subuh" } // ternary operator.
  ];
}

function saveReminders(reminders) { // ( -> reminder array)
  localStorage.setItem('solatReminders', JSON.stringify(reminders)); // js array -> json string 
}

function renderTable() { // crud operations 
  const reminders = getReminders(); // retrieves all data from local storage 
  tableBody.innerHTML = ''; // clears all existing conetent inside table body to avoid duplicate records when refresh  

  if (reminders.length == 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No reminders saved yet.</td></tr>`;
    return; // 4 columns in a table
  }

  reminders.forEach((item, index) => { // loop every reminder in array. item -> reminder, index -> position reminder in array (1,2,3,..)
    const row = document.createElement('tr'); // create ops 
    row.innerHTML = `
      <td style="text-align: center;">${index + 1}</td>
      <td>${item.title}</td>
      <td>${item.time}</td> 
      <td style="text-align: center;">
        <button onclick="editReminder(${index})">Edit</button>
        <button onclick="deleteReminder(${index})" style="color: red;">Delete</button>
      </td>
    `;
    // index start from 1 not 0, display title & time. edit and delete function is here 
    tableBody.appendChild(row);
  });
}

reminderForm.addEventListener('submit', (e) => { // update form, e -> event object, => is an arrow func
  e.preventDefault(); // update form details w/o making the page refresh 
  const title = titleInput.value.trim(); // retrived input title text
  const time = timeInput.value.trim(); // retrived time imput
  const editIndex = parseInt(editIndexInput.value); // convert value into int 

  let reminders = getReminders(); // allow array to be modified 

  if (editIndex == -1) { // add new reminder, add data at end of array 
    reminders.push({ title, time });
  } else { 
    reminders[editIndex] = { title, time }; // replace data with updated info 
    editIndexInput.value = '-1'; // next submission -> new reminder 
    submitBtn.innerText = 'Add Reminder';
  }

  saveReminders(reminders); // save to local storage 
  reminderForm.reset(); // clear input fields after sumit 
  renderTable(); // refresh & display latest records
});

window.editReminder = function(index) { // edit ops, use this bcs edit button use inline html event 
  const reminders = getReminders(); // retrieve all saved reminders from local storage 
  const item = reminders[index]; // seelcts based on array index 
  
  titleInput.value = item.title; // identify which reminder needs to be updated
  timeInput.value = item.time;
  editIndexInput.value = index;
  submitBtn.innerText = 'Update Reminder'; // from add reminder -> update reminder, when user click edit 
};

window.deleteReminder = function(index) {
  if (confirm('Are you sure you want to delete this reminder?')) { // confirm -> built-in js func (pop-up message)
    let reminders = getReminders();
    reminders.splice(index, 1); // .splice -> remove @ replace elements 
    saveReminders(reminders); // saved update into local storage 
    renderTable(); // func called to refresh table 
  }
};

window.addEventListener('DOMContentLoaded', () => { // load last saved records, => arrow func that runs after event occurs 
  renderTable(); // retrieve and display all saved reminders 
});