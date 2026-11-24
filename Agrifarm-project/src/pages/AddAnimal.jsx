import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { animalService } from '../services/animalService';
import { ArrowLeft, Save } from 'lucide-react';

export default function AddAnimal() {
  const navigate = useNavigate();
  const { reloadData } = useFarm();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    tag: '',
    type: 'Cow',
    breed: '',
    gender: 'Female',
    birthDate: '',
    weight: '',
    healthStatus: 'Healthy'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const created = animalService.create(formData);
      showToast(`Animal ${created.tag} successfully registered with ID #${created.id}`, 'success');
      reloadData();
      navigate('/animals');
    } catch (err) {
      if (err.validationErrors) {
        setErrors(err.validationErrors);
      } else {
        showToast(err.message || 'Registration failed', 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ marginBottom: 18 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Register New Livestock</h1>
        <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem', marginBottom: 24 }}>
          Establish an immutable telemetry record for livestock identification and medical tracking.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Ear Tag / ID Token *</label>
              <input
                type="text"
                name="tag"
                className="form-control"
                placeholder="e.g. COW-2026-90"
                value={formData.tag}
                onChange={handleChange}
                maxLength={50}
              />
              {errors.tag && <span className="form-error">{errors.tag}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Animal Classification *</label>
              <select name="type" className="form-control" value={formData.type} onChange={handleChange}>
                <option value="Cow">Cow</option>
                <option value="Goat">Goat</option>
                <option value="Sheep">Sheep</option>
                <option value="Buffalo">Buffalo</option>
                <option value="Chicken">Chicken</option>
                <option value="Duck">Duck</option>
                <option value="Other">Other</option>
              </select>
              {errors.type && <span className="form-error">{errors.type}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Breed *</label>
              <input
                type="text"
                name="breed"
                className="form-control"
                placeholder="e.g. Angus, Boer, Merino"
                value={formData.breed}
                onChange={handleChange}
                maxLength={40}
              />
              {errors.breed && <span className="form-error">{errors.breed}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Biological Gender *</label>
              <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
              {errors.gender && <span className="form-error">{errors.gender}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Birth Date *</label>
              <input
                type="date"
                name="birthDate"
                className="form-control"
                value={formData.birthDate}
                onChange={handleChange}
              />
              {errors.birthDate && <span className="form-error">{errors.birthDate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Current Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                name="weight"
                className="form-control"
                placeholder="Positive number"
                value={formData.weight}
                onChange={handleChange}
              />
              {errors.weight && <span className="form-error">{errors.weight}</span>}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Health & Quarantine Status *</label>
              <select name="healthStatus" className="form-control" value={formData.healthStatus} onChange={handleChange}>
                <option value="Healthy">Healthy</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Sick">Sick</option>
                <option value="Recovering">Recovering</option>
              </select>
              {errors.healthStatus && <span className="form-error">{errors.healthStatus}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/animals')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} /> Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}