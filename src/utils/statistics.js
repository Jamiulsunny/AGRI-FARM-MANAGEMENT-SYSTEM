export function calculateFarmStatistics(animals = []) {
  const active = animals.filter(a => !a.isDeleted);
  const deleted = animals.filter(a => a.isDeleted);

  const totalActive = active.length;
  const totalDeleted = deleted.length;

  const validWeights = active
    .map(a => Number(a.weight))
    .filter(w => !isNaN(w) && isFinite(w) && w > 0);

  const totalWeight = validWeights.reduce((acc, curr) => acc + curr, 0);
  const avgWeight = validWeights.length > 0 ? totalWeight / validWeights.length : 0;
  const minWeight = validWeights.length > 0 ? Math.min(...validWeights) : 0;
  const maxWeight = validWeights.length > 0 ? Math.max(...validWeights) : 0;

  // Counts by Type
  const typeCounts = active.reduce((acc, a) => {
    const t = a.type || 'Other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  // Counts by Gender
  const genderCounts = active.reduce((acc, a) => {
    const g = a.gender || 'Unknown';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  // Counts by Health Status
  const healthCounts = active.reduce((acc, a) => {
    const h = a.healthStatus || 'Other';
    acc[h] = (acc[h] || 0) + 1;
    return acc;
  }, {});

  const healthyCount = healthCounts['Healthy'] || 0;
  const attentionCount = totalActive - healthyCount;

  return {
    totalActive,
    totalDeleted,
    healthyCount,
    attentionCount,
    totalWeight: Math.round(totalWeight * 100) / 100,
    avgWeight: Math.round(avgWeight * 100) / 100,
    minWeight,
    maxWeight,
    typeCounts,
    genderCounts,
    healthCounts
  };
}