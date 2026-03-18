function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Secure Cloud Storage</h1>
        <p>
          Store, share and access your files anywhere in the world with
          lightning fast cloud storage.
        </p>

        <button className="primary-btn">
          Get Started
        </button>
      </div>

      <div className="hero-image">
        <img
          src="https://images.unsplash.com/photo-1593642532400-2682810df593"
          alt="cloud"
        />
      </div>
    </section>
  );
}

export default Hero;