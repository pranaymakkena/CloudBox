import { useEffect, useState } from "react";
import API from "../api/axiosConfig";
import Layout from "../components/layout/Layout";
import Toast from "../components/common/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/style.css";

function Profile() {
  const { messages, removeToast, toast } = useToast();
  const [user, setUser] = useState({});
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/user/profile");
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value
    });
  };

  const updateProfile = async () => {
    try {
      await API.put("/user/profile", user);
      toast.success("Profile updated!");
      setEdit(false);
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  return (
    <Layout type="user">

      <div className="content">

        <h2 className="page-title">Profile</h2>

        <div className="profile-wrapper">

          <div className="profile-card">

            {/* FIRST NAME */}
            <div className="profile-row">
              <span>First Name</span>
              {edit ? (
                <input name="firstName" value={user.firstName || ""} onChange={handleChange} />
              ) : (
                <strong>{user.firstName}</strong>
              )}
            </div>

            {/* LAST NAME */}
            <div className="profile-row">
              <span>Last Name</span>
              {edit ? (
                <input name="lastName" value={user.lastName || ""} onChange={handleChange} />
              ) : (
                <strong>{user.lastName}</strong>
              )}
            </div>

            {/* EMAIL */}
            <div className="profile-row">
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>

            {/* GENDER */}
            <div className="profile-row">
              <span>Gender</span>
              {edit ? (
                <select name="gender" value={user.gender || ""} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              ) : (
                <strong>{user.gender}</strong>
              )}
            </div>

            {/* AGE */}
            <div className="profile-row">
              <span>Age</span>
              {edit ? (
                <input type="number" name="age" value={user.age || ""} onChange={handleChange} />
              ) : (
                <strong>{user.age}</strong>
              )}
            </div>

            {/* LOCATION */}
            <div className="profile-row">
              <span>Location</span>
              {edit ? (
                <input name="location" value={user.location || ""} onChange={handleChange} />
              ) : (
                <strong>{user.location}</strong>
              )}
            </div>

            {/* BUTTONS */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>

              {edit ? (
                <>
                  <button className="btn btn-success" onClick={updateProfile}>
                    Save
                  </button>

                  <button
                    className="btn btn-danger"
                    style={{ marginLeft: "10px" }}
                    onClick={() => setEdit(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setEdit(true)}>
                  Edit Profile
                </button>
              )}

            </div>

          </div>

        </div>

      </div>

      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default Profile;