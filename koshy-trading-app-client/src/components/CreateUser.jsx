import React, { useState } from 'react';

function CreateUser() {
    const [errorMessage, setErrorMessage] = useState('');

    const handleAddUser = async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const repeat_password = document.getElementById('repeat_password').value;
      const dob = document.getElementById('dob').value;
      const pob = document.getElementById('pob').value;
      
      if (!username || !password || !repeat_password || !dob || !pob) {
        setErrorMessage('All fields are required');
        return;
      }
      if (password !== repeat_password) {
        console.log('Passwords do not match');
        return;
      }  
      try {
        const response = await fetch(`http://localhost:2000/api/insert_user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username,
            password,
            dob,
            pob
          })
        });
        const data = await response.json();
        if (response.ok) {
          console.log('User inserted successfully');
        } else {
          console.log('Some error occurred:', data.message);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

  return (
    <div className="container" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <h2 className="text-center mb-4">Create New User</h2>
      <form>
        <div className="form-group">
          <label htmlFor="username">Email:</label>
          <input type="email" className="form-control" id="username" placeholder="Enter email as username" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input type="password" className="form-control" id="password" placeholder="Enter password" required />
        </div>
        <div className="form-group">
          <label htmlFor="repeat_password">Repeat Password:</label>
          <input type="password" className="form-control" id="repeat_password" placeholder="Enter password" required />
        </div>
        <div className="form-group">
          <label htmlFor="dob">Date of Birth:</label>
          <input type="date" className="form-control" id="dob" placeholder="Enter Date of Birth" required />
        </div>
        <div className="form-group">
          <label htmlFor="pob">Place of Birth:</label>
          <input type="text" className="form-control" id="pob" placeholder="Enter Place of Birth" required />
        </div>
        {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
        <button type="button" className="btn btn-primary btn-block" onClick={handleAddUser}>Add User</button>
      </form>
    </div>
  );
}

export default CreateUser;
