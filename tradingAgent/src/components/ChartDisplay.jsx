import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  TimeScale, LinearScale,
  PointElement, LineElement,
  Tooltip, Legend
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function ChartDisplay({ data }) {
  const chartData = {
    labels: data.map(pt => pt.timestamp),
    datasets: [{ label: 'Portfolio Value', data: data.map(pt => pt.value), fill: false, tension: 0.1 }]
  };

  const options = {
    scales: { x: { type: 'time', time: { unit: 'day' } }, y: { beginAtZero: true } }
  };

  return <Line data={chartData} options={options} />;
}
