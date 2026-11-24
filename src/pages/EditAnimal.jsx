import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { animalService } from '../services/animalService';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditAnimal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reloadData } = useFarm();
  const { showToast } = useToast();

  const [formData, setFormData] = useState(null);
  const [healthNote, setHealthNote] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const record = animalService.getById(id);
    if (!record) {
      showToast('Record not found', 'danger');
      navigate('/animals');
    } else {
      setFormData({
        tag: record.tag,
        type: record.type,
        breed: record.breed,
        gender: record.gender,
        birthDate: record.birthDate,
        weight: record.weight,
        healthStatus: record.healthStatus
      });
    }
  }, [id, navigate, showToast]);

  if (!formData) return <div>Loading Record...</div>;

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    setErrors({});

    try {
      animalService.update(id, { ...formData, healthNote });
      showToast(`Record #${id} updated successfully`, 'success');
      reloadData();
      navigate(`/animals/${id}`);
    } catch (err) {
      if (err.validationErrors) {
        setErrors(err.validationErrors);
      } else {
        showToast(err.message || 'Update failed', 'danger');
      }
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: 18 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Edit Livestock Record #{id}</h1>
        <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem', marginBottom: 24 }}>
          Modify permitted parameters. Historical identifier remains invariant.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Ear Tag *</label>
              <input
                type="text"
                name="tag"
                className="form-control"
                value={formData.tag}
                onChange={handleChange}
                maxLength={50}
              />
              {errors.tag && <span className="form-error">{errors.tag}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Type *</label>
              <input
                type="text"
                name="type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
                maxLength={30}
              />
              {errors.type && <span className="form-error">{errors.type}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Breed *</label>
              <input
                type="text"
                name="breed"
                className="form-control"
                value={formData.breed}
                onChange={handleChange}
                maxLength={40}
              />
              {errors.breed && <span className="form-error">{errors.breed}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Gender *</label>
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
                value={formData.weight}
                onChange={handleChange}
              />
              {errors.weight && <span className="form-error">{errors.weight}</span>}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Health Status *</label>
              <select name="healthStatus" className="form-control" value={formData.healthStatus} onChange={handleChange}>
                <option value="Healthy">Healthy</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Sick">Sick</option>
                <option value="Recovering">Recovering</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Status Transition Note (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Reason or medical diagnosis for status shift"
                value={healthNote}
                onChange={e => setHealthNote(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Update Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}