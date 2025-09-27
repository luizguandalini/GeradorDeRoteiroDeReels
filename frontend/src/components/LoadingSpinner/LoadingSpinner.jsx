import logo from "../../../shaka.png";
import "./LoadingSpinner.css";

function LoadingSpinner() {
  return (
    <div className="spinner-overlay" style={{ backgroundColor: "#785cce" }}>
      <img src={logo} alt="Logo Shaka" className="spinner-logo" />
    </div>
  );
}

export default LoadingSpinner;
