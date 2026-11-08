const Spinner = ({ splash = "LOADING..." }) => {
  return (
    <div className="text-center my-5 py-4">
      <div
        className="spinner-border m-3"
        style={{
          width: "3rem",
          height: "3rem",
          color: "var(--cms-btn-primary)",
          borderWidth: "3px",
        }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <h4
        className="mt-2"
        style={{
          fontFamily: "var(--cms-font-heading)",
          letterSpacing: "2px",
          color: "var(--cms-heading-color)",
        }}
      >
        {splash}
      </h4>
    </div>
  );
};

export default Spinner;
