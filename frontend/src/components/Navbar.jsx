import { Link } from "react-router-dom";

function Landing() {
  return (
    <div>

      <nav className="navbar">
  <div className="container nav-inner">

    <h2 className="logo">CloudBox</h2>

    <div className="nav-buttons">
      <Link to="/login">
        <button className="login">Login</button>
      </Link>

      <Link to="/register">
        <button className="register">Register</button>
      </Link>
    </div>

  </div>
</nav>

      <section className="hero">
        <h1>Secure Cloud Storage</h1>
        <p>Upload, store and access your files anywhere.</p>
      </section>

    </div>
  );
}

export default Landing;