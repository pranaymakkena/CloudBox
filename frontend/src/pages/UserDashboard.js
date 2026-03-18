import { useEffect, useState } from "react";

function UserDashboard() {
  const [user, setUser] = useState({});
  const [editMode, setEditMode] = useState(false);

  // ✅ Fetch profile
  useEffect(() => {
    fetch("/api/user/profile", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        console.log("User Data:", data); // debug
        setUser(data);
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  // ✅ Handle input change
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // ✅ Update profile
  const updateProfile = () => {
    fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify(user),
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditMode(false);
        alert("Profile updated successfully");
      });
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#f4f6f8"
    }}>
      <div style={{
        width: "400px",
        background: "#fff",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)"
      }}>

        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          User Profile
        </h2>

        {/* 👁 VIEW MODE */}
        {!editMode ? (
          <>
            <p><b>First Name:</b> {user.firstName}</p>
            <p><b>Last Name:</b> {user.lastName}</p>
            <p><b>Gender:</b> {user.gender}</p>
            <p><b>Age:</b> {user.age}</p>
            <p><b>Location:</b> {user.location}</p>

            <button onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
          </>
        ) : (

        /* ✏ EDIT MODE */
          <>
            <label>First Name</label>
            <input name="firstName" value={user.firstName || ""} onChange={handleChange} />

            <label>Last Name</label>
            <input name="lastName" value={user.lastName || ""} onChange={handleChange} />

            <label>Gender</label>
            <select name="gender" value={user.gender || ""} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <label>Age</label>
            <input name="age" value={user.age || ""} onChange={handleChange} />

            <label>Location</label>
            <input name="location" value={user.location || ""} onChange={handleChange} />

            <button onClick={updateProfile}>
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;