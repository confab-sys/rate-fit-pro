import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import datalabels plugin
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  ChartDataLabels
);

const RatingCharts = ({ aggregatedRatings, weeklyRatings, currentDate, staffName, showOnlyCategoryAverages, hideYearOneProgress, hideFourYearProgress, hideSixYearProgress, hideTwentyYearProgress }) => {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [currentWeekRange, setCurrentWeekRange] = useState({ start: 1, end: 12 });
  const [currentMonthRange, setCurrentMonthRange] = useState({ start: 0, end: 5 });
  const weeksPerPage = 12;
  const monthsPerPage = 6;

  // Define category colors and labels based on the image
  const categoryConfig = {
    time: {
      label: 'Time',
      color: 'rgba(59, 130, 246, 0.8)', // Blue from image
      borderColor: 'rgba(59, 130, 246, 1)'
    },
    creativity: {
      label: 'Creativity',
      color: 'rgba(239, 68, 68, 0.8)', // Red from image
      borderColor: 'rgba(239, 68, 68, 1)'
    },
    shelf_cleanliness: {
      label: 'S. clean',
      color: 'rgba(250, 204, 21, 0.8)', // Yellow from image
      borderColor: 'rgba(250, 204, 21, 1)'
    },
    stock_management: {
      label: 'Stock. M',
      color: 'rgba(45, 212, 191, 0.8)', // Cyan/Teal from image
      borderColor: 'rgba(45, 212, 191, 1)'
    },
    customer_service: {
      label: 'Customer',
      color: 'rgba(249, 115, 22, 0.8)', // Orange from image
      borderColor: 'rgba(249, 115, 22, 1)'
    },
    discipline_cases: {
      label: 'Discipline',
      color: 'rgba(168, 85, 247, 0.8)', // Purple from image
      borderColor: 'rgba(168, 85, 247, 1)'
    },
    personal_grooming: {
      label: 'P.grooming',
      color: 'rgba(34, 197, 94, 0.8)', // Green from image
      borderColor: 'rgba(34, 197, 94, 1)'
    }
  };

  // Find the latest weekly rating
  const latestWeeklyRating = weeklyRatings.reduce((latest, current) => {
    return (latest && latest.week > current.week) ? latest : current;
  }, null);

  // Prepare data for category averages bar chart (using latest weekly data)
  const categoryData = {
    labels: Object.keys(categoryConfig).map(key => categoryConfig[key].label),
    datasets: [
      {
        label: latestWeeklyRating ? `Week ${latestWeeklyRating.week} Averages` : 'Category Averages',
        data: Object.keys(categoryConfig).map(categoryKey => 
          latestWeeklyRating?.[categoryKey]?.percentage || 0
        ),
        backgroundColor: Object.values(categoryConfig).map(config => config.color),
        borderColor: Object.values(categoryConfig).map(config => config.borderColor),
        borderWidth: 1
      }
    ]
  };

  // Prepare data for weekly progress bar chart
  const uniqueWeeks = [...new Set(weeklyRatings.map(rating => rating.week))]
    .sort((a, b) => a - b)
    .filter(week => week >= currentWeekRange.start && week <= currentWeekRange.end);

  const weeklyProgressLabels = uniqueWeeks.map(week => `Week ${week}`);

  const weeklyData = {
    labels: weeklyProgressLabels,
    datasets: Object.keys(categoryConfig).map(categoryKey => ({
      label: categoryConfig[categoryKey].label,
      data: uniqueWeeks.map(week => {
        const weekRating = weeklyRatings.find(rating => rating.week === week);
        return weekRating?.[categoryKey]?.percentage || 0;
      }),
      backgroundColor: categoryConfig[categoryKey].color,
      borderColor: categoryConfig[categoryKey].borderColor,
      borderWidth: 1
    }))
  };

  // Calculate total average score across all weeks
  const calculateTotalAverage = () => {
    const categories = Object.keys(categoryConfig);
    let totalSum = 0;
    let totalCount = 0;

    weeklyRatings.forEach(rating => {
      categories.forEach(category => {
        const percentage = rating[category]?.percentage || 0;
        if (percentage > 0) {
          totalSum += percentage;
          totalCount++;
        }
      });
    });

    return totalCount > 0 ? Math.round(totalSum / totalCount) : 0;
  };

  const totalAverage = calculateTotalAverage();

  // Prepare data for weekly average progress bar chart
  const weeklyAverageData = {
    labels: weeklyProgressLabels,
    datasets: [{
      label: 'Weekly Average Score',
      data: uniqueWeeks.map(week => {
        const weekRating = weeklyRatings.find(rating => rating.week === week);
        if (!weekRating) return 0;
        
        // Calculate average of all categories for this week
        const categories = Object.keys(categoryConfig);
        const sum = categories.reduce((total, category) => 
          total + (weekRating[category]?.percentage || 0), 0);
        return Math.round(sum / categories.length);
      }),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  };

  // Calculate average percentage for each category across all weeks
  const categoryAveragesData = {
    labels: Object.keys(categoryConfig).map(key => categoryConfig[key].label),
    datasets: [{
      label: 'Average Across All Weeks',
      data: Object.keys(categoryConfig).map(categoryKey => {
        // Get all ratings for this category
        const categoryRatings = weeklyRatings
          .map(rating => rating[categoryKey]?.percentage || 0)
          .filter(percentage => percentage > 0); // Filter out weeks with no ratings
        
        // Calculate average
        const sum = categoryRatings.reduce((total, percentage) => total + percentage, 0);
        return categoryRatings.length > 0 ? Math.round(sum / categoryRatings.length) : 0;
      }),
      backgroundColor: Object.values(categoryConfig).map(config => config.color),
      borderColor: Object.values(categoryConfig).map(config => config.borderColor),
      borderWidth: 1
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: `Today's Ratings (${staffName || 'Staff'})`,
        color: 'white',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          color: 'white',
          callback: function(value) {
            return value + '%';
          },
          stepSize: 10,
          max: 100
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'white'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false
      }
    }
  };

  // Options for the weekly progress chart (clustered bars)
  const weeklyProgressOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        ...barOptions.plugins.title,
        text: `Weekly Progress (${staffName || 'Staff'})`
      },
      tooltip: {
         callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw;
              return `${label}: ${value}%`;
            }
         }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      ...barOptions.scales,
      x: {
        ...barOptions.scales.x,
        ticks: {
          ...barOptions.scales.x.ticks,
          callback: function(value, index) {
            const weekNumber = currentWeekRange.start + index;
            // Calculate average for this week across all categories
            const weekData = weeklyData.datasets
              .filter(dataset => dataset.label !== 'Total Average')
              .map(dataset => dataset.data[index]);
            
            const weekAverage = Math.round(
              weekData.reduce((sum, val) => sum + val, 0) / weekData.length
            );
            
            return [
              `Week ${weekNumber}`,
              `${weekAverage}%`
            ];
          }
        }
      }
    }
  };

  // Options for the weekly average progress chart
  const weeklyAverageOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        ...barOptions.plugins.title,
        text: `Weekly Average Progress (${staffName || 'Staff'}) - Total Average: ${totalAverage}%`
      },
      datalabels: {
        display: false
      }
    }
  };

  // Options for the category averages chart
  const categoryAveragesOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        ...barOptions.plugins.title,
        text: `Category Averages Across All Weeks (${staffName || 'Staff'})`
      },
      datalabels: {
        display: false
      }
    }
  };

  // Calculate net growth/decline data
  const calculateNetGrowth = () => {
    const sortedRatings = [...weeklyRatings].sort((a, b) => a.week - b.week);
    const categories = Object.keys(categoryConfig);
    
    const growthData = sortedRatings.map((rating, index) => {
      if (index === 0) return 0; // First week has no growth to compare
      
      const currentWeekTotal = categories.reduce((sum, category) => 
        sum + (rating[category]?.percentage || 0), 0) / categories.length;
      
      const previousWeekTotal = categories.reduce((sum, category) => 
        sum + (sortedRatings[index - 1][category]?.percentage || 0), 0) / categories.length;
      
      return Math.round(currentWeekTotal - previousWeekTotal);
    });

    // Calculate total average net growth
    const totalGrowth = growthData.reduce((sum, growth) => sum + growth, 0);
    const averageGrowth = Math.round(totalGrowth / (growthData.length - 1)); // Exclude first week

    return {
      weeklyGrowth: growthData,
      averageGrowth
    };
  };

  const { weeklyGrowth, averageGrowth } = calculateNetGrowth();

  const netGrowthData = {
    labels: weeklyProgressLabels,
    datasets: [{
      label: 'Net Growth/Decline',
      data: weeklyGrowth,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
    }]
  };

  const netGrowthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: `Net Growth/Decline in Ratings (${staffName || 'Staff'}) - Avg: ${averageGrowth > 0 ? '+' : ''}${averageGrowth}%`,
        color: 'white',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            return `${value > 0 ? '+' : ''}${value}%`;
            }
         }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'white',
          callback: function(value) {
            return value > 0 ? `+${value}%` : `${value}%`;
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'white'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  // Options for the pie chart
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: `Category Distribution (${staffName || 'Staff'})`,
        color: 'white',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            return `${label}: ${value}%`;
          }
        }
      },
      datalabels: {
        color: 'white',
        formatter: (value, context) => {
          return value + '%';
        },
        font: {
          weight: 'bold'
        }
      }
    }
  };

  // Function to download chart as PDF
  const downloadChartAsPDF = async (chartId, title) => {
    const chartElement = document.getElementById(chartId);
    const canvas = await html2canvas(chartElement);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${title}_${currentDate}.pdf`);
  };

  // Function to download chart data as CSV
  const downloadChartAsCSV = (data, title) => {
    // Special handling for Weekly Progress chart
    if (title === 'Weekly Progress') {
      // Find the latest week with ratings
      const latestWeek = weeklyRatings.reduce((max, rating) => 
        Math.max(max, rating.week), 0);
      
      // Use the minimum between latest week and 52
      const totalWeeks = Math.min(latestWeek, 52);
      
      // Create headers for all weeks
      const headers = ['Category', ...Array.from({ length: totalWeeks }, (_, i) => `Week ${i + 1}`)];
      
      // Create rows for each category
      const rows = Object.keys(categoryConfig).map(categoryKey => {
        const categoryData = Array(totalWeeks).fill(0);
        
        // Fill in the data for weeks that have ratings
        weeklyRatings.forEach(rating => {
          if (rating.week <= totalWeeks) {
            const weekIndex = rating.week - 1;
            if (rating[categoryKey] && typeof rating[categoryKey] === 'object') {
              categoryData[weekIndex] = rating[categoryKey].percentage || 0;
            } else if (rating[categoryKey]) {
              categoryData[weekIndex] = rating[categoryKey];
            }
          }
        });
        
        return [
          categoryConfig[categoryKey].label,
          ...categoryData
        ];
      });
      
      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const currentDate = new Date();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${title}_${staffName || 'Staff'}_${currentDate.getFullYear()}_${currentDate}.csv`);
      return;
    }

    // Default handling for other charts
    const headers = ['Category', ...data.labels];
    const rows = data.datasets.map(dataset => {
      return [
        dataset.label,
        ...dataset.data.map(value => value)
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${title}_${staffName || 'Staff'}_${currentDate}.csv`);
  };

  // Function to render download overlay
  const renderDownloadOverlay = (chartId, title, data) => {
    if (activeOverlay !== chartId) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setActiveOverlay(null)}
      >
        <div 
          className="bg-[#1B263B] p-6 rounded-lg shadow-lg"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-white text-lg font-semibold mb-4">Download Report</h3>
          <div className="flex gap-4">
            <button
              onClick={() => {
                downloadChartAsPDF(chartId, title);
                setActiveOverlay(null);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              PDF
            </button>
            <button
              onClick={() => {
                downloadChartAsCSV(data, title);
                setActiveOverlay(null);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              CSV
            </button>
            <button
              onClick={() => setActiveOverlay(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Function to render report button
  const renderReportButton = (chartId, title, data) => (
    <div className="absolute top-2 right-2">
      <button
        onClick={() => setActiveOverlay(chartId)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
      >
        Report
      </button>
      {renderDownloadOverlay(chartId, title, data)}
    </div>
  );

  // Navigation functions for months
  const handlePreviousMonths = () => {
    if (currentMonthRange.start > 0) {
      setCurrentMonthRange(prev => ({
        start: Math.max(0, prev.start - monthsPerPage),
        end: Math.max(monthsPerPage - 1, prev.end - monthsPerPage)
      }));
    }
  };

  const handleNextMonths = () => {
    if (currentMonthRange.end < 11) { // Assuming we have 12 months total
      setCurrentMonthRange(prev => ({
        start: Math.min(6, prev.start + monthsPerPage),
        end: Math.min(11, prev.end + monthsPerPage)
      }));
    }
  };

  // Function to calculate monthly averages from weekly data
  const calculateMonthlyAverages = () => {
    // Get the first rating's date from weeklyRatings
    const firstRating = weeklyRatings[0];
    if (!firstRating) return { labels: [], datasets: [] };

    // Calculate the start date based on the first rating
    const startDate = new Date(firstRating.timestamp);
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();

    // Generate month labels for all months
    const monthLabels = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (startMonth + i) % 12;
      const year = startMonth + i >= 12 ? startYear + 1 : startYear;
      const date = new Date(year, monthIndex, 1);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });

    const monthRanges = [
      { start: 1, end: 4, label: monthLabels[0] },
      { start: 5, end: 8, label: monthLabels[1] },
      { start: 9, end: 12, label: monthLabels[2] },
      { start: 13, end: 16, label: monthLabels[3] },
      { start: 17, end: 20, label: monthLabels[4] },
      { start: 21, end: 24, label: monthLabels[5] },
      { start: 25, end: 28, label: monthLabels[6] },
      { start: 29, end: 32, label: monthLabels[7] },
      { start: 33, end: 36, label: monthLabels[8] },
      { start: 37, end: 40, label: monthLabels[9] },
      { start: 41, end: 44, label: monthLabels[10] },
      { start: 45, end: 48, label: monthLabels[11] }
    ].slice(currentMonthRange.start, currentMonthRange.end + 1);

    const monthlyData = {
      labels: monthRanges.map(range => range.label),
      datasets: Object.keys(categoryConfig).map(categoryKey => ({
        label: categoryConfig[categoryKey].label,
        data: monthRanges.map(range => {
          // Get all ratings for this month's weeks
          const monthRatings = weeklyRatings.filter(rating => 
            rating.week >= range.start && rating.week <= range.end
          );

          // If no ratings for this month, return 0
          if (monthRatings.length === 0) return 0;

          // Calculate average for this category across all weeks in the month
          const sum = monthRatings.reduce((total, rating) => {
            // Handle both direct percentage and nested percentage structure
            let percentage = 0;
            if (rating[categoryKey] && typeof rating[categoryKey] === 'object') {
              percentage = rating[categoryKey].percentage || 0;
            } else if (rating[categoryKey]) {
              percentage = rating[categoryKey];
            }
            return total + percentage;
          }, 0);

          return Math.round(sum / monthRatings.length);
        }),
        backgroundColor: categoryConfig[categoryKey].color,
        borderColor: categoryConfig[categoryKey].borderColor,
        borderWidth: 1
      }))
    };

    // Add total average line
    monthlyData.datasets.push({
      label: 'Total Average',
      data: monthRanges.map(range => {
        const monthRatings = weeklyRatings.filter(rating => 
          rating.week >= range.start && rating.week <= range.end
        );

        if (monthRatings.length === 0) return 0;

        // Calculate average across all categories for each week
        const weeklyAverages = monthRatings.map(rating => {
          const categories = Object.keys(categoryConfig);
          const sum = categories.reduce((total, category) => {
            let percentage = 0;
            if (rating[category] && typeof rating[category] === 'object') {
              percentage = rating[category].percentage || 0;
            } else if (rating[category]) {
              percentage = rating[category];
            }
            return total + percentage;
          }, 0);
          return sum / categories.length;
        });

        // Calculate average of all weekly averages
        const totalSum = weeklyAverages.reduce((sum, avg) => sum + avg, 0);
        return Math.round(totalSum / weeklyAverages.length);
      }),
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 1)',
      borderWidth: 2,
      type: 'line',
      fill: false,
      tension: 0.4
    });

    return monthlyData;
  };

  const monthlyData = calculateMonthlyAverages();

  // Calculate total net growth/decline for monthly progress
  const calculateMonthlyNetGrowth = () => {
    // Get all month averages, excluding months with no data (0)
    const monthAverages = monthlyData.datasets
      .filter(dataset => dataset.label !== 'Total Average')
      .map(dataset => dataset.data)
      .reduce((acc, curr) => {
        curr.forEach((val, idx) => {
          if (!acc[idx]) acc[idx] = [];
          acc[idx].push(val);
        });
        return acc;
      }, [])
      .map(monthData => {
        const avg = Math.round(monthData.reduce((sum, val) => sum + val, 0) / monthData.length);
        return avg > 0 ? avg : null; // Return null for months with no data
      });

    // Calculate growth between consecutive months and accumulate
    let totalGrowth = 0;
    let previousMonth = null;

    monthAverages.forEach((currentMonth, index) => {
      if (currentMonth !== null) { // Only process months with data
        if (previousMonth !== null) {
          // Calculate growth from previous month
          const growth = currentMonth - previousMonth;
          totalGrowth += growth;
        }
        previousMonth = currentMonth;
      }
    });

    return totalGrowth;
  };

  const monthlyNetGrowth = calculateMonthlyNetGrowth();

  // Options for the monthly chart
  const monthlyOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        ...barOptions.plugins.title,
        text: `6-Month Progress (${staffName || 'Staff'})`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value}%`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      ...barOptions.scales,
      x: {
        ...barOptions.scales.x,
        ticks: {
          ...barOptions.scales.x.ticks,
          callback: function(value, index) {
            // Calculate average for this month across all categories
            const monthData = monthlyData.datasets
              .filter(dataset => dataset.label !== 'Total Average')
              .map(dataset => dataset.data[index]);
            
            const monthAverage = Math.round(
              monthData.reduce((sum, val) => sum + val, 0) / monthData.length
            );

            // Calculate growth from previous month
            let monthGrowth = '';
            if (index > 0) {
              const prevMonthData = monthlyData.datasets
                .filter(dataset => dataset.label !== 'Total Average')
                .map(dataset => dataset.data[index - 1]);
              
              const prevMonthAverage = Math.round(
                prevMonthData.reduce((sum, val) => sum + val, 0) / prevMonthData.length
              );
              
              if (prevMonthAverage > 0 && monthAverage > 0) {
                const growth = monthAverage - prevMonthAverage;
                monthGrowth = growth !== 0 ? `${growth > 0 ? '+' : ''}${growth}%` : '';
              }
            }
            
            return [
              `${monthlyData.labels[index]}`,
              `${monthAverage}%`,
              monthGrowth
            ];
          }
        }
      }
    }
  };

  // Function to calculate yearly averages from weekly data
  const calculateYearlyAverages = () => {
    // Get the first rating's date from weeklyRatings
    const firstRating = weeklyRatings[0];
    if (!firstRating) return { labels: [], datasets: [] };

    // Calculate the start date based on the first rating
    const startDate = new Date(firstRating.timestamp);
    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();

    // Generate month labels for 12 months starting from the first rating
    const monthLabels = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (startMonth + i) % 12;
      const year = startMonth + i >= 12 ? startYear + 1 : startYear;
      const date = new Date(year, monthIndex, 1);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });

    const monthRanges = [
      { start: 1, end: 4, label: monthLabels[0] },
      { start: 5, end: 8, label: monthLabels[1] },
      { start: 9, end: 12, label: monthLabels[2] },
      { start: 13, end: 16, label: monthLabels[3] },
      { start: 17, end: 20, label: monthLabels[4] },
      { start: 21, end: 24, label: monthLabels[5] },
      { start: 25, end: 28, label: monthLabels[6] },
      { start: 29, end: 32, label: monthLabels[7] },
      { start: 33, end: 36, label: monthLabels[8] },
      { start: 37, end: 40, label: monthLabels[9] },
      { start: 41, end: 44, label: monthLabels[10] },
      { start: 45, end: 48, label: monthLabels[11] }
    ];

    const yearlyData = {
      labels: monthRanges.map(range => range.label),
      datasets: [
        ...Object.keys(categoryConfig).map(categoryKey => ({
          label: categoryConfig[categoryKey].label,
          data: monthRanges.map(range => {
            // Get all ratings for this month's weeks
            const monthRatings = weeklyRatings.filter(rating => 
              rating.week >= range.start && rating.week <= range.end
            );

            // If no ratings for this month, return 0
            if (monthRatings.length === 0) return 0;

            // Calculate average for this category across all weeks in the month
            const sum = monthRatings.reduce((total, rating) => {
              let percentage = 0;
              if (rating[categoryKey] && typeof rating[categoryKey] === 'object') {
                percentage = rating[categoryKey].percentage || 0;
              } else if (rating[categoryKey]) {
                percentage = rating[categoryKey];
              }
              return total + percentage;
            }, 0);

            return Math.round(sum / monthRatings.length);
          }),
          backgroundColor: categoryConfig[categoryKey].color,
          borderColor: categoryConfig[categoryKey].borderColor,
          borderWidth: 1
        })),
        {
          label: 'Total Average',
          data: monthRanges.map(range => {
            const monthRatings = weeklyRatings.filter(rating => 
              rating.week >= range.start && rating.week <= range.end
            );

            if (monthRatings.length === 0) return 0;

            // Calculate average across all categories for each week
            const weeklyAverages = monthRatings.map(rating => {
              const categories = Object.keys(categoryConfig);
              const sum = categories.reduce((total, category) => {
                let percentage = 0;
                if (rating[category] && typeof rating[category] === 'object') {
                  percentage = rating[category].percentage || 0;
                } else if (rating[category]) {
                  percentage = rating[category];
                }
                return total + percentage;
              }, 0);
              return sum / categories.length;
            });

            // Calculate average of all weekly averages
            const totalSum = weeklyAverages.reduce((sum, avg) => sum + avg, 0);
            return Math.round(totalSum / weeklyAverages.length);
          }),
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: 'rgba(255, 255, 255, 1)',
          borderWidth: 2,
          type: 'line',
          fill: false,
          tension: 0.4
        }
      ]
    };

    return yearlyData;
  };

  const yearlyData = calculateYearlyAverages();

  // Calculate total net growth/decline for the year
  const calculateTotalNetGrowth = () => {
    // Get all month averages, excluding months with no data (0)
    const monthAverages = yearlyData.datasets
      .filter(dataset => dataset.label !== 'Total Average')
      .map(dataset => dataset.data)
      .reduce((acc, curr) => {
        curr.forEach((val, idx) => {
          if (!acc[idx]) acc[idx] = [];
          acc[idx].push(val);
        });
        return acc;
      }, [])
      .map(monthData => {
        const avg = Math.round(monthData.reduce((sum, val) => sum + val, 0) / monthData.length);
        return avg > 0 ? avg : null; // Return null for months with no data
      });

    // Calculate growth between consecutive months and accumulate
    let totalGrowth = 0;
    let previousMonth = null;

    monthAverages.forEach((currentMonth, index) => {
      if (currentMonth !== null) { // Only process months with data
        if (previousMonth !== null) {
          // Calculate growth from previous month
          const growth = currentMonth - previousMonth;
          totalGrowth += growth;
        }
        previousMonth = currentMonth;
      }
    });

    return totalGrowth;
  };

  const totalNetGrowth = calculateTotalNetGrowth();

  // Options for the yearly chart
  const yearlyOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        ...barOptions.plugins.title,
        text: `Year 1 Progress (${staffName || 'Staff'})`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value}%`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        title: {
          display: true,
          text: 'Percentage Score',
          color: 'white'
        }
      },
      x: {
        ...barOptions.scales.x,
        ticks: {
          ...barOptions.scales.x.ticks,
          callback: function(value, index) {
            // Calculate average for this month across all categories
            const monthData = yearlyData.datasets
              .filter(dataset => dataset.label !== 'Total Average')
              .map(dataset => dataset.data[index]);
            
            const monthAverage = Math.round(
              monthData.reduce((sum, val) => sum + val, 0) / monthData.length
            );

            // Calculate growth from previous month
            let monthGrowth = '';
            if (index > 0) {
              const prevMonthData = yearlyData.datasets
                .filter(dataset => dataset.label !== 'Total Average')
                .map(dataset => dataset.data[index - 1]);
              
              const prevMonthAverage = Math.round(
                prevMonthData.reduce((sum, val) => sum + val, 0) / prevMonthData.length
              );
              
              if (prevMonthAverage > 0 && monthAverage > 0) {
                const growth = monthAverage - prevMonthAverage;
                monthGrowth = growth !== 0 ? `${growth > 0 ? '+' : ''}${growth}%` : '';
              }
            }
            
            return [
              `${yearlyData.labels[index]}`,
              `${monthAverage}%`,
              monthGrowth
            ];
          }
        }
      }
    }
  };

  // Function to calculate four-year averages from weekly data
  const calculateFourYearAverages = () => {
    // Get the first rating's date from weeklyRatings
    const firstRating = weeklyRatings[0];
    if (!firstRating) return { labels: [], datasets: [] };

    // Calculate the start date based on the first rating
    const startDate = new Date(firstRating.timestamp);
    const startYear = startDate.getFullYear();

    // Generate year labels for 4 years starting from the first rating
    const yearLabels = Array.from({ length: 4 }, (_, i) => {
      return `${startYear + i}`;
    });

    const yearRanges = [
      { start: 1, end: 52, label: yearLabels[0] },
      { start: 53, end: 104, label: yearLabels[1] },
      { start: 105, end: 156, label: yearLabels[2] },
      { start: 157, end: 208, label: yearLabels[3] }
    ];

    // Calculate category averages and total averages for each year
    const categoryData = Object.keys(categoryConfig).map(categoryKey => ({
      label: categoryConfig[categoryKey].label,
      data: yearRanges.map(range => {
        const yearRatings = weeklyRatings.filter(rating => 
          rating.week >= range.start && rating.week <= range.end
        );

        if (yearRatings.length === 0) return 0;

        const sum = yearRatings.reduce((total, rating) => {
          let percentage = 0;
          if (rating[categoryKey] && typeof rating[categoryKey] === 'object') {
            percentage = rating[categoryKey].percentage || 0;
          } else if (rating[categoryKey]) {
            percentage = rating[categoryKey];
          }
          return total + percentage;
        }, 0);

        return Math.round(sum / yearRatings.length);
      }),
      backgroundColor: categoryConfig[categoryKey].color,
      borderColor: categoryConfig[categoryKey].borderColor,
      borderWidth: 1
    }));

    // Calculate total averages for each year
    const totalAverages = yearRanges.map(range => {
      const yearRatings = weeklyRatings.filter(rating => 
        rating.week >= range.start && rating.week <= range.end
      );

      if (yearRatings.length === 0) return 0;

      // Calculate average across all categories for each week
      const weeklyAverages = yearRatings.map(rating => {
        const categories = Object.keys(categoryConfig);
        const sum = categories.reduce((total, category) => {
          let percentage = 0;
          if (rating[category] && typeof rating[category] === 'object') {
            percentage = rating[category].percentage || 0;
          } else if (rating[category]) {
            percentage = rating[category];
          }
          return total + percentage;
        }, 0);
        return sum / categories.length;
      });

      // Calculate average of all weekly averages
      const totalSum = weeklyAverages.reduce((sum, avg) => sum + avg, 0);
      return Math.round(totalSum / weeklyAverages.length);
    });

    // Add total averages dataset
    categoryData.push({
      label: 'Total Average',
      data: totalAverages,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 1)',
      borderWidth: 2,
      type: 'line',
      fill: false,
      tension: 0.4
    });

    const fourYearData = {
      labels: yearRanges.map(range => `Year ${range.label}`),
      datasets: categoryData
    };

    return fourYearData;
  };

  const fourYearData = calculateFourYearAverages();

  // Calculate total net growth/decline for four years
  const calculateFourYearNetGrowth = () => {
    // Get all year averages, excluding years with no data (0)
    const yearAverages = fourYearData.datasets
      .filter(dataset => dataset.label !== 'Total Average')
      .map(dataset => dataset.data)
      .reduce((acc, curr) => {
        curr.forEach((val, idx) => {
          if (!acc[idx]) acc[idx] = [];
          acc[idx].push(val);
        });
        return acc;
      }, [])
      .map(yearData => {
        const avg = Math.round(yearData.reduce((sum, val) => sum + val, 0) / yearData.length);
        return avg > 0 ? avg : null; // Return null for years with no data
      });

    // Calculate growth between consecutive years and accumulate
    let totalGrowth = 0;
    let previousYear = null;

    yearAverages.forEach((currentYear, index) => {
      if (currentYear !== null) { // Only process years with data
        if (previousYear !== null) {
          // Calculate growth from previous year
          const growth = currentYear - previousYear;
          totalGrowth += growth;
        }
        previousYear = currentYear;
      }
    });

    return totalGrowth;
  };

  const fourYearNetGrowth = calculateFourYearNetGrowth();

  // Options for the four-year chart
  const fourYearOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        ...barOptions.plugins.title,
        text: `Four-Year Progress (${staffName || 'Staff'})`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value}%`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        title: {
          display: true,
          text: 'Percentage Score',
          color: 'white'
        }
      },
      x: {
        ...barOptions.scales.x,
        ticks: {
          ...barOptions.scales.x.ticks,
          callback: function(value, index) {
            // Calculate average for this year across all categories
            const yearData = fourYearData.datasets
              .filter(dataset => dataset.label !== 'Total Average')
              .map(dataset => dataset.data[index]);
            
            const yearAverage = Math.round(
              yearData.reduce((sum, val) => sum + val, 0) / yearData.length
            );

            // Calculate growth from previous year
            let yearGrowth = '';
            if (index > 0) {
              const prevYearData = fourYearData.datasets
                .filter(dataset => dataset.label !== 'Total Average')
                .map(dataset => dataset.data[index - 1]);
              
              const prevYearAverage = Math.round(
                prevYearData.reduce((sum, val) => sum + val, 0) / prevYearData.length
              );
              
              if (prevYearAverage > 0 && yearAverage > 0) {
                const growth = yearAverage - prevYearAverage;
                yearGrowth = growth !== 0 ? `${growth > 0 ? '+' : ''}${growth}%` : '';
              }
            }
            
            return [
              `${fourYearData.labels[index]}`,
              `${yearAverage}%`,
              yearGrowth
            ];
          }
        }
      }
    }
  };

  // Function to calculate six-year averages from weekly data
  const calculateSixYearAverages = () => {
    // Get the first rating's date from weeklyRatings
    const firstRating = weeklyRatings[0];
    if (!firstRating) return { labels: [], datasets: [] };

    // Calculate the start date based on the first rating
    const startDate = new Date(firstRating.timestamp);
    const startYear = startDate.getFullYear();

    // Generate year labels for 6 years starting from the first rating
    const yearLabels = Array.from({ length: 6 }, (_, i) => {
      return `${startYear + i}`;
    });

    const yearRanges = [
      { start: 1, end: 52, label: yearLabels[0] },
      { start: 53, end: 104, label: yearLabels[1] },
      { start: 105, end: 156, label: yearLabels[2] },
      { start: 157, end: 208, label: yearLabels[3] },
      { start: 209, end: 260, label: yearLabels[4] },
      { start: 261, end: 312, label: yearLabels[5] }
    ];

    // Calculate category averages and total averages for each year
    const categoryData = Object.keys(categoryConfig).map(categoryKey => ({
      label: categoryConfig[categoryKey].label,
      data: yearRanges.map(range => {
        const yearRatings = weeklyRatings.filter(rating => 
          rating.week >= range.start && rating.week <= range.end
        );

        if (yearRatings.length === 0) return 0;

        const sum = yearRatings.reduce((total, rating) => {
          let percentage = 0;
          if (rating[categoryKey] && typeof rating[categoryKey] === 'object') {
            percentage = rating[categoryKey].percentage || 0;
          } else if (rating[categoryKey]) {
            percentage = rating[categoryKey];
          }
          return total + percentage;
        }, 0);

        return Math.round(sum / yearRatings.length);
      }),
      backgroundColor: categoryConfig[categoryKey].color,
      borderColor: categoryConfig[categoryKey].borderColor,
      borderWidth: 1
    }));

    // Calculate total averages for each year
    const totalAverages = yearRanges.map(range => {
      const yearRatings = weeklyRatings.filter(rating => 
        rating.week >= range.start && rating.week <= range.end
      );

      if (yearRatings.length === 0) return 0;

      // Calculate average across all categories for each week
      const weeklyAverages = yearRatings.map(rating => {
        const categories = Object.keys(categoryConfig);
        const sum = categories.reduce((total, category) => {
          let percentage = 0;
          if (rating[category] && typeof rating[category] === 'object') {
            percentage = rating[category].percentage || 0;
          } else if (rating[category]) {
            percentage = rating[category];
          }
          return total + percentage;
        }, 0);
        return sum / categories.length;
      });

      // Calculate average of all weekly averages
      const totalSum = weeklyAverages.reduce((sum, avg) => sum + avg, 0);
      return Math.round(totalSum / weeklyAverages.length);
    });

    // Add total averages dataset
    categoryData.push({
      label: 'Total Average',
      data: totalAverages,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 1)',
      borderWidth: 2,
      type: 'line',
      fill: false,
      tension: 0.4
    });

    const sixYearData = {
      labels: yearRanges.map(range => `Year ${range.label}`),
      datasets: categoryData
    };

    return sixYearData;
  };

  const sixYearData = calculateSixYearAverages();

  // Calculate total net growth/decline for six years
  const calculateSixYearNetGrowth = () => {
    // Get all year averages, excluding years with no data (0)
    const yearAverages = sixYearData.datasets
      .filter(dataset => dataset.label !== 'Total Average')
      .map(dataset => dataset.data)
      .reduce((acc, curr) => {
        curr.forEach((val, idx) => {
          if (!acc[idx]) acc[idx] = [];
          acc[idx].push(val);
        });
        return acc;
      }, [])
      .map(yearData => {
        const avg = Math.round(yearData.reduce((sum, val) => sum + val, 0) / yearData.length);
        return avg > 0 ? avg : null; // Return null for years with no data
      });

    // Calculate growth between consecutive years and accumulate
    let totalGrowth = 0;
    let previousYear = null;

    yearAverages.forEach((currentYear, index) => {
      if (currentYear !== null) { // Only process years with data
        if (previousYear !== null) {
          // Calculate growth from previous year
          const growth = currentYear - previousYear;
          totalGrowth += growth;
        }
        previousYear = currentYear;
      }
    });

    return totalGrowth;
  };

  const sixYearNetGrowth = calculateSixYearNetGrowth();

  // Options for the six-year chart
  const sixYearOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        ...barOptions.plugins.title,
        text: `Six-Year Progress (${staffName || 'Staff'})`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value}%`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        title: {
          display: true,
          text: 'Percentage Score',
          color: 'white'
        }
      },
      x: {
        ...barOptions.scales.x,
        ticks: {
          ...barOptions.scales.x.ticks,
          callback: function(value, index) {
            // Calculate average for this year across all categories
            const yearData = sixYearData.datasets
              .filter(dataset => dataset.label !== 'Total Average')
              .map(dataset => dataset.data[index]);
            
            const yearAverage = Math.round(
              yearData.reduce((sum, val) => sum + val, 0) / yearData.length
            );

            // Calculate growth from previous year
            let yearGrowth = '';
            if (index > 0) {
              const prevYearData = sixYearData.datasets
                .filter(dataset => dataset.label !== 'Total Average')
                .map(dataset => dataset.data[index - 1]);
              
              const prevYearAverage = Math.round(
                prevYearData.reduce((sum, val) => sum + val, 0) / prevYearData.length
              );
              
              if (prevYearAverage > 0 && yearAverage > 0) {
                const growth = yearAverage - prevYearAverage;
                yearGrowth = growth !== 0 ? `${growth > 0 ? '+' : ''}${growth}%` : '';
              }
            }
            
            return [
              `${sixYearData.labels[index]}`,
              `${yearAverage}%`,
              yearGrowth
            ];
          }
        }
      }
    }
  };

  // Function to calculate twenty-year averages from weekly data
  const calculateTwentyYearAverages = () => {
    // Get the first rating's date from weeklyRatings
    const firstRating = weeklyRatings[0];
    if (!firstRating) return { labels: [], datasets: [] };

    // Calculate the start date based on the first rating
    const startDate = new Date(firstRating.timestamp);
    const startYear = startDate.getFullYear();

    // Generate year labels for 20 years starting from the first rating
    const yearLabels = Array.from({ length: 20 }, (_, i) => {
      return `${startYear + i}`;
    });

    const yearRanges = Array.from({ length: 20 }, (_, i) => ({
      start: (i * 52) + 1,
      end: (i + 1) * 52,
      label: yearLabels[i]
    }));

    // Calculate category averages and total averages for each year
    const categoryData = Object.keys(categoryConfig).map(categoryKey => ({
      label: categoryConfig[categoryKey].label,
      data: yearRanges.map(range => {
        const yearRatings = weeklyRatings.filter(rating => 
          rating.week >= range.start && rating.week <= range.end
        );

        if (yearRatings.length === 0) return 0;

        const sum = yearRatings.reduce((total, rating) => {
          let percentage = 0;
          if (rating[categoryKey] && typeof rating[categoryKey] === 'object') {
            percentage = rating[categoryKey].percentage || 0;
          } else if (rating[categoryKey]) {
            percentage = rating[categoryKey];
          }
          return total + percentage;
        }, 0);

        return Math.round(sum / yearRatings.length);
      }),
      backgroundColor: categoryConfig[categoryKey].color,
      borderColor: categoryConfig[categoryKey].borderColor,
      borderWidth: 1
    }));

    // Calculate total averages for each year
    const totalAverages = yearRanges.map(range => {
      const yearRatings = weeklyRatings.filter(rating => 
        rating.week >= range.start && rating.week <= range.end
      );

      if (yearRatings.length === 0) return 0;

      // Calculate average across all categories for each week
      const weeklyAverages = yearRatings.map(rating => {
        const categories = Object.keys(categoryConfig);
        const sum = categories.reduce((total, category) => {
          let percentage = 0;
          if (rating[category] && typeof rating[category] === 'object') {
            percentage = rating[category].percentage || 0;
          } else if (rating[category]) {
            percentage = rating[category];
          }
          return total + percentage;
        }, 0);
        return sum / categories.length;
      });

      // Calculate average of all weekly averages
      const totalSum = weeklyAverages.reduce((sum, avg) => sum + avg, 0);
      return Math.round(totalSum / weeklyAverages.length);
    });

    // Add total averages dataset
    categoryData.push({
      label: 'Total Average',
      data: totalAverages,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 1)',
      borderWidth: 2,
      type: 'line',
      fill: false,
      tension: 0.4
    });

    const twentyYearData = {
      labels: yearRanges.map(range => `Year ${range.label}`),
      datasets: categoryData
    };

    return twentyYearData;
  };

  const twentyYearData = calculateTwentyYearAverages();

  // Options for the twenty-year chart
  const twentyYearOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      title: {
        ...barOptions.plugins.title,
        text: `Twenty-Year Progress (${staffName || 'Staff'})`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value}%`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        title: {
          display: true,
          text: 'Percentage Score',
          color: 'white'
        }
      },
      x: {
        ...barOptions.scales.x,
        ticks: {
          ...barOptions.scales.x.ticks,
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  // Navigation functions
  const handlePreviousWeeks = () => {
    if (currentWeekRange.start > 1) {
      setCurrentWeekRange(prev => ({
        start: Math.max(1, prev.start - weeksPerPage),
        end: Math.max(weeksPerPage, prev.end - weeksPerPage)
      }));
    }
  };

  const handleNextWeeks = () => {
    if (currentWeekRange.end < 52) {
      setCurrentWeekRange(prev => ({
        start: Math.min(41, prev.start + weeksPerPage),
        end: Math.min(52, prev.end + weeksPerPage)
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Date Title */}
      <h2 className="text-white text-2xl font-bold">{currentDate}</h2>

      {/* Show only category averages chart if showOnlyCategoryAverages is true */}
      {showOnlyCategoryAverages ? (
        <div className="bg-[#1B263B] rounded-lg p-6 h-[400px] relative">
          {renderReportButton('categoryAveragesAll', 'Category Averages All Weeks', categoryAveragesData)}
          <div id="categoryAveragesAll" className="w-full h-full">
            <Bar data={categoryAveragesData} options={categoryAveragesOptions} />
          </div>
        </div>
      ) : (
        <>
          {/* Weekly Progress Chart - Full Width */}
          <div className="bg-[#1B263B] rounded-lg p-6 h-[400px] relative">
            {renderReportButton('weeklyProgress', 'Weekly Progress', weeklyData)}
            <div id="weeklyProgress" className="w-full h-full">
              <Bar data={weeklyData} options={weeklyProgressOptions} />
            </div>
            {/* Week Navigation Arrows */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                onClick={handlePreviousWeeks}
                disabled={currentWeekRange.start <= 1}
                className={`p-2 rounded-full text-white text-2xl font-bold ${
                  currentWeekRange.start <= 1
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-blue-500 hover:text-blue-600'
                }`}
              >
                {'<'}
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={handleNextWeeks}
                disabled={currentWeekRange.end >= 52}
                className={`p-2 rounded-full text-white text-2xl font-bold ${
                  currentWeekRange.end >= 52
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-blue-500 hover:text-blue-600'
                }`}
              >
                {'>'}
              </button>
            </div>
            {/* Week Range Display */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <span className="text-white bg-[#1B263B] px-4 py-2 rounded-lg">
                Weeks {currentWeekRange.start}-{currentWeekRange.end}
              </span>
            </div>
          </div>

          {/* 6-Month Progress Chart with Net Growth Section */}
          <div className="bg-[#1B263B] rounded-lg p-6 relative">
            <div className="h-[400px] relative">
              {renderReportButton('monthlyProgress', '6-Month Progress', monthlyData)}
              <div id="monthlyProgress" className="w-full h-full">
                <Bar data={monthlyData} options={monthlyOptions} />
              </div>
              <button
                onClick={handlePreviousMonths}
                disabled={currentMonthRange.start <= 0}
                className={`absolute -left-8 top-1/2 -translate-y-1/2 p-2 rounded-full text-white text-2xl font-bold ${
                  currentMonthRange.start <= 0
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-blue-500 hover:text-blue-600'
                }`}
              >
                {'<'}
              </button>
              <button
                onClick={handleNextMonths}
                disabled={currentMonthRange.end >= 11}
                className={`absolute -right-8 top-1/2 -translate-y-1/2 p-2 rounded-full text-white text-2xl font-bold ${
                  currentMonthRange.end >= 11
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-blue-500 hover:text-blue-600'
                }`}
              >
                {'>'}
              </button>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
                <span className="text-white bg-[#1B263B] px-4 py-2 rounded-lg">
                  Months {currentMonthRange.start + 1}-{currentMonthRange.end + 1}
                </span>
              </div>
            </div>
            {/* Net Growth Section */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">Total Net Growth/Decline:</span>
                <span className={`text-lg font-semibold ${monthlyNetGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {monthlyNetGrowth > 0 ? '+' : ''}{monthlyNetGrowth}%
                </span>
              </div>
            </div>
          </div>

          {/* Year 1 Progress Chart with Net Growth Section */}
          <div className={`bg-[#1B263B] rounded-lg p-6 relative ${hideYearOneProgress ? 'hidden' : ''}`}>
            <div className="h-[400px]">
              {renderReportButton('yearlyProgress', 'Year 1 Progress', yearlyData)}
              <div id="yearlyProgress" className="w-full h-full">
                <Bar data={yearlyData} options={yearlyOptions} />
              </div>
            </div>
            {/* Net Growth Section */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">Total Net Growth/Decline:</span>
                <span className={`text-lg font-semibold ${totalNetGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalNetGrowth > 0 ? '+' : ''}{totalNetGrowth}%
                </span>
              </div>
            </div>
          </div>

          {/* Four-Year Progress Chart with Net Growth Section */}
          <div className={`bg-[#1B263B] rounded-lg p-6 relative ${hideFourYearProgress ? 'hidden' : ''}`}>
            <div className="h-[400px]">
              {renderReportButton('fourYearProgress', 'Four-Year Progress', fourYearData)}
              <div id="fourYearProgress" className="w-full h-full">
                <Bar data={fourYearData} options={fourYearOptions} />
              </div>
            </div>
            {/* Net Growth Section */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">Total Net Growth/Decline:</span>
                <span className={`text-lg font-semibold ${fourYearNetGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {fourYearNetGrowth > 0 ? '+' : ''}{fourYearNetGrowth}%
                </span>
              </div>
            </div>
          </div>

          {/* Six-Year Progress Chart with Net Growth Section */}
          <div className={`bg-[#1B263B] rounded-lg p-6 relative ${hideSixYearProgress ? 'hidden' : ''}`}>
            <div className="h-[400px]">
              {renderReportButton('sixYearProgress', 'Six-Year Progress', sixYearData)}
              <div id="sixYearProgress" className="w-full h-full">
                <Bar data={sixYearData} options={sixYearOptions} />
              </div>
            </div>
            {/* Net Growth Section */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">Total Net Growth/Decline:</span>
                <span className={`text-lg font-semibold ${sixYearNetGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {sixYearNetGrowth > 0 ? '+' : ''}{sixYearNetGrowth}%
                </span>
              </div>
            </div>
          </div>

          {/* Twenty-Year Progress Chart */}
          <div className={`bg-[#1B263B] rounded-lg p-6 relative ${hideTwentyYearProgress ? 'hidden' : ''}`}>
            <div className="h-[400px]">
              {renderReportButton('twentyYearProgress', 'Twenty-Year Progress', twentyYearData)}
              <div id="twentyYearProgress" className="w-full h-full">
                <Bar data={twentyYearData} options={twentyYearOptions} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Averages Chart */}
            <div className="bg-[#1B263B] rounded-lg p-6 h-[350px] relative">
              {renderReportButton('categoryAverages', 'Category Averages', categoryData)}
              <div id="categoryAverages" className="w-full h-full">
                <Bar data={categoryData} options={barOptions} />
              </div>
            </div>

            {/* Weekly Average Progress Chart */}
            <div className="bg-[#1B263B] rounded-lg p-6 h-[350px] relative">
              {renderReportButton('weeklyAverage', 'Weekly Average', weeklyAverageData)}
              <div id="weeklyAverage" className="w-full h-full">
                <Bar data={weeklyAverageData} options={weeklyAverageOptions} />
              </div>
            </div>

            {/* Category Averages Across All Weeks Chart */}
            <div className="bg-[#1B263B] rounded-lg p-6 h-[350px] relative">
              {renderReportButton('categoryAveragesAll', 'Category Averages All Weeks', categoryAveragesData)}
              <div id="categoryAveragesAll" className="w-full h-full">
                <Bar data={categoryAveragesData} options={categoryAveragesOptions} />
              </div>
            </div>

            {/* Net Growth/Decline Chart */}
            <div className="bg-[#1B263B] rounded-lg p-6 h-[350px] relative">
              {renderReportButton('netGrowth', 'Net Growth', netGrowthData)}
              <div id="netGrowth" className="w-full h-full">
                <Line data={netGrowthData} options={netGrowthOptions} />
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-[#1B263B] rounded-lg p-6 h-[350px] relative">
              {renderReportButton('pieChart', 'Category Distribution', categoryAveragesData)}
              <div id="pieChart" className="w-full h-full flex items-center justify-center">
                <Pie data={categoryAveragesData} options={pieOptions} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RatingCharts;