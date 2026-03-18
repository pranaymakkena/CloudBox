import "./Landing.css"
import { Link } from "react-router-dom"

function Landing(){
return(

<div>

<nav className="navbar">

<h2 className="logo">CloudBox</h2>

<div className="nav-buttons">

<Link to="/login">
<button className="login">Login</button>
</Link>

<Link to="/register">
<button className="register">Register</button>
</Link>

</div>

</nav>

<section className="hero">

<div className="hero-text">

<h1>Secure <span>Cloud Storage</span></h1>

<p>Upload, manage and access your files anytime anywhere.</p>

<Link to="/register">
<button>Get Started</button>
</Link>

</div>

<img src="https://www.hkcert.org/f/guideline/218189/930p523/hkcert-Cloud%20Storage%20Security%20banner-1860x1046.jpg"/>

</section>

<section className="features">

<h2>Our Features</h2>

<div className="feature-grid">

<div className="card">
<img src="https://img.icons8.com/color/96/cloud-storage.png"/>
<h3>Cloud Storage</h3>
<p>Store files securely in the cloud.</p>
</div>

<div className="card">
<img src="https://img.icons8.com/color/96/upload.png"/>
<h3>Upload Files</h3>
<p>Upload your files easily.</p>
</div>

<div className="card">
<img src="https://img.icons8.com/color/96/security-checked.png"/>
<h3>Secure</h3>
<p>Encrypted secure storage.</p>
</div>

</div>

</section>

<footer className="footer">

<p>© 2026 CloudBox. All rights reserved.</p>

</footer>

</div>

)
}

export default Landing