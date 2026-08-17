const repo = require('../repository/dashboard.repository');

class DashboardService {
  async getDashboardStats() {
    const rawData = await repo.getDashboardStats();
    
    // Process format labels for Doughnut Chart
    if (rawData.tournamentsByFormat) {
      rawData.tournamentsByFormat = rawData.tournamentsByFormat.map(item => {
        let label = item.label;
        if (label === 'single_elimination') label = 'Single Elimination';
        else if (label === 'double_elimination') label = 'Double Elimination';
        else if (label === 'round_robin') label = 'Round Robin';
        else if (label === 'round_scoring') label = 'Round Scoring';
        else if (label === 'hybrid') label = 'Hybrid';
        else if (label) {
          label = label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        return { label, value: parseInt(item.value, 10) };
      });
    }

    if (rawData.tournamentsBySport) {
        rawData.tournamentsBySport = rawData.tournamentsBySport.map(item => ({
            label: item.label,
            value: parseInt(item.value, 10)
        }));
    }

    if (rawData.recentTournaments) {
        rawData.recentTournaments = rawData.recentTournaments.map(item => {
            // Treat 'published' as 'Active' as per instructions
            let displayStatus = item.status;
            if (item.status === 'published' || item.status === 'active') {
                displayStatus = 'Active';
            } else if (item.status === 'draft') {
                displayStatus = 'Draft';
            } else if (item.status === 'completed') {
                displayStatus = 'Completed';
            } else if (item.status === 'upcoming') {
                displayStatus = 'Upcoming';
            }

            let displayFormat = item.format;
            if (displayFormat === 'single_elimination') displayFormat = 'Single Elimination';
            else if (displayFormat === 'double_elimination') displayFormat = 'Double Elimination';
            else if (displayFormat === 'round_robin') displayFormat = 'Round Robin';
            else if (displayFormat === 'round_scoring') displayFormat = 'Round Scoring';
            else if (displayFormat === 'hybrid') displayFormat = 'Hybrid';
            else if (displayFormat) {
                displayFormat = displayFormat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }

            return {
                ...item,
                status: displayStatus,
                format: displayFormat
            };
        });
    }

    return rawData;
  }
}

module.exports = new DashboardService();
