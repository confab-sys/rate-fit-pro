import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const WeeklyAnalysisChart = ({ analysisData }) => {
  if (!analysisData) return null;

  const { categories } = analysisData;

  // Prepare data for category comparison bar chart
  const barChartData = {
    labels: [
      'Time',
      'Creativity',
      'Shelf Cleanliness',
      'Stock Management',
      'Customer Service',
      'Discipline Cases',
      'Personal Grooming'
    ],
    datasets: [
      {
        label: 'Category Scores',
        data: [
          categories.time,
          categories.creativity,
          categories.shelf_cleanliness,
          categories.stock_management,
          categories.customer_service,
          categories.discipline_cases,
          categories.personal_grooming
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Category-wise Performance (Averages Across All Weeks)',
        color: 'white'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: 'white'
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

  return (
    <div className="bg-[#0D1B2A] p-6 rounded-lg">
      <div className="bg-[#1B263B] p-4 rounded-lg">
        <Bar data={barChartData} options={barChartOptions} />
      </div>
    </div>
  );
};
export default WeeklyAnalysisChart;
