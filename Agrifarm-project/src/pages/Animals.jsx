import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import { animalService } from '../services/animalService';
import { exportService } from '../services/exportService';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Filter, Download, Edit2, Trash2, Eye } from 'lucide-react';

export default function Animals() {
  const { animals, reloadData } = useFarm();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterHealth, setFilterHealth] = useState('All');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, animal: null });

  const activeAnimals = useMemo(() => animals.filter(a => !a.isDeleted), [animals]);

  const uniqueTypes = useMemo(() => {
    return ['All', ...new Set(activeAnimals.map(a => a.type))];
  }, [activeAnimals]);

  const filtered = useMemo(() => {
    return activeAnimals.filter(a => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        a.tag.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.breed.toLowerCase().includes(q) ||
        String(a.id).includes(q) ||
        a.healthStatus.toLowerCase().includes(q);

      const matchesType = filterType === 'All' || a.type === filterType;
      const matchesHealth = filterHealth === 'All' || a.healthStatus === filterHealth;

      return matchesSearch && matchesType && matchesHealth;
    });
  }, [activeAnimals, searchTerm, filterType, filterHealth]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let vA = a[sortField];
      let vB = b[sortField];
      if (typeof vA === 'string') vA = vA.toLowerCase();
      if (typeof vB === 'string') vB = vB.toLowerCase();
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = field => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const confirmDelete = () => {
    try {
      animalService.softDelete(deleteModal.animal.id);
      showToast(`Record moved to Deleted Animals (#${deleteModal.animal.tag})`, 'success');
      reloadData();
    } catch (err) {
      showToast('Deletion failed', 'danger');
    } finally {
      setDeleteModal({ isOpen: false, animal: null });
    }
  };

  const handleExportCSV = () => {
    const csv = exportService.toCSV(sorted);
    exportService.downloadFile(csv, `agri_farm_active_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    showToast('Exported active animals to CSV', 'success');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Livestock Directory</h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
            Comprehensive directory of currently managed farm livestock.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <Link to="/add-animal" className="btn btn-primary">
            <Plus size={16} /> Add Animal
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--secondary-text)' }} />
            <input
              type="text"
              placeholder="Search tag, breed, ID..."
              className="form-control"
              style={{ paddingLeft: 36 }}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Filter size={16} color="var(--secondary-text)" />
            <select
              className="form-control"
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              {uniqueTypes.map(t => (
                <option key={t} value={t}>Type: {t}</option>
              ))}
            </select>

            <select
              className="form-control"
              value={filterHealth}
              onChange={e => {
                setFilterHealth(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">Health: All</option>
              <option value="Healthy">Healthy</option>
              <option value="Under Treatment">Under Treatment</option>
              <option value="Sick">Sick</option>
              <option value="Recovering">Recovering</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>ID</th>
              <th onClick={() => handleSort('tag')}>Tag Number</th>
              <th onClick={() => handleSort('type')}>Type</th>
              <th onClick={() => handleSort('breed')}>Breed</th>
              <th onClick={() => handleSort('gender')}>Gender</th>
              <th onClick={() => handleSort('birthDate')}>Birth Date</th>
              <th onClick={() => handleSort('weight')}>Weight (kg)</th>
              <th onClick={() => handleSort('healthStatus')}>Health Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map(a => (
                <tr key={a.id}>
                  <td>#{a.id}</td>
                  <td style={{ fontWeight: 600 }}>{a.tag}</td>
                  <td>{a.type}</td>
                  <td>{a.breed}</td>
                  <td>{a.gender}</td>
                  <td>{a.birthDate}</td>
                  <td>{a.weight}</td>
                  <td><Badge status={a.healthStatus} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/animals/${a.id}`} className="btn-icon" title="Inspect Profile" style={{ color: 'var(--primary-green)' }}>
                        <Eye size={17} />
                      </Link>
                      <Link to={`/edit-animal/${a.id}`} className="btn-icon" title="Edit Record" style={{ color: 'var(--info)' }}>
                        <Edit2 size={17} />
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, animal: a })}
                        className="btn-icon"
                        title="Soft Delete"
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: 36, color: 'var(--secondary-text)' }}>
                  No active animals match current filtering criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} entries
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Move Record to Deleted Inventory?"
        message={`Are you sure you want to remove animal ${deleteModal.animal?.tag} (#${deleteModal.animal?.id})? The record will be preserved in Deleted Animals and can be restored.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, animal: null })}
        confirmText="Move to Trash"
      />
    </div>
  );
}