import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Layout from "../../components/layout/Layout";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";

function AdminFileSharingControl() {
  const { messages, removeToast, toast } = useToast();
  const [shares, setShares] = useState([]);

  useEffect(() => { fetchShares(); }, []);

  const fetchShares = async () => {
    try {
      const res = await API.get("/admin/shares");
      setShares(res.data);
    } catch (err) {
      toast.error("Failed to load sharing data");
    }
  };

  const revokeAccess = async (id) => {
    if (!window.confirm("Revoke access?")) return;
    try {
      await API.delete(`/admin/share/${id}`);
      fetchShares();
      toast.success("Access revoked");
    } catch (err) {
      toast.error(err.response?.data || "Failed");
    }
  };

  return (
    <Layout type="admin">
      <div className="content">

        <h2 className="dashboard-title">File Sharing Control</h2>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Owner</th>
                <th>Shared With</th>
                <th>Permission</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {shares.length > 0 ? (
                shares.map(s => (
                  <tr key={s.id}>
                    <td>{s.fileName}</td>
                    <td>{s.ownerEmail}</td>
                    <td>{s.sharedWith}</td>
                    <td>{s.permission}</td>

                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => revokeAccess(s.id)}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No sharing records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
      <Toast messages={messages} removeToast={removeToast} />
    </Layout>
  );
}

export default AdminFileSharingControl;
