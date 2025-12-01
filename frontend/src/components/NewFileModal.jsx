import { useState } from "react";
import "./NewFileModal.css";

export default function NewFileModal({ opened, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      setError("File name is required");
      return;
    }
    setError("");
    onCreate(name.trim());
    setName("");
  };

  if (!opened) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h2 className="modal-title">New File</h2>

        <label className="label">File Name</label>
        <input
          type="text"
          className="modal-input"
          placeholder="e.g. myfile.cpp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button className="btn btn-gray" onClick={onClose}>Cancel</button>
          <button className="btn btn-blue" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}
