function LoadingScreen({ message }) {
  return (
    <div className="loading-screen">
      <div className="spinner" aria-hidden />
      <p>{message}</p>
    </div>
  );
}

export default LoadingScreen;
