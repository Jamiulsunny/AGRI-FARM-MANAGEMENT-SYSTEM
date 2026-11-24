import React from 'react';

export default function Badge({ status }) {
  const norm = (status || '').toLowerCase().replace(/\s+/g, '-');
  let badgeClass = 'badge-custom';

  if (norm === 'healthy') badgeClass = 'badge-healthy';
  else if (norm === 'sick') badgeClass = 'badge-sick';
  else if (norm === 'under-treatment') badgeClass = 'badge-under-treatment';
  else if (norm === 'recovering') badgeClass = 'badge-recovering';

  return <span className={`badge ${badgeClass}`}>{status}</span>;
}