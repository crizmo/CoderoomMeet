import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import io from 'socket.io-client';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const VitalsChart = ({ socket }) => {
    // const { room, username } = useParams();
    const [heartRateData, setHeartRateData] = useState([]);
    const [leftRRData, setLeftRRData] = useState([]);
    const [rightRRData, setRightRRData] = useState([]);
    const [ecgData, setEcgData] = useState([]);
    const [respLData, setRespLData] = useState([]);
    const [respRData, setRespRData] = useState([])

    useEffect(() => {
        // const socket = io(import.meta.env.VITE_SERVER_URL, {
        //     path: '/samiksha/socket.io'
        // });

        // socket.emit('join-call', `#/${room}`, username);

        // console.log('Joining room:', room);
        console.log(socket)

        socket.on('vitals', (vitalsArray) => {
            console.log(vitalsArray);
            
            const userVitals = vitalsArray.find(v => 
                v.id === socket.id,
            );

            if (userVitals) {
                // Update heart rate
                if (userVitals.pulse_arr) {
                    setHeartRateData(userVitals.pulse_arr);
                }
                // Update left and right respiratory rates
                if (userVitals.left_rr_arr) {
                    setLeftRRData(userVitals.left_rr_arr);
                }
                if (userVitals.right_rr_arr) {
                    setRightRRData(userVitals.right_rr_arr);
                }

                // Update ECG data
                if (Array.isArray(userVitals.ecg)) {
                    setEcgData(userVitals.ecg); // Set entire array
                }

                // Update respiratory data
                if (Array.isArray(userVitals.Resp_L)) {
                    setRespLData(userVitals.Resp_L); // Set entire array
                }
                if (Array.isArray(userVitals.Resp_R)) {
                    setRespRData(userVitals.Resp_R); // Set entire array
                }
            }
        });

        // return () => socket.disconnect();
    }, []);

    // Calculate min and max for y-axis limits
    const getYLimits = (data) => {
        if (data.length === 0) return { min: 0, max: 1 }; // Default limits if no data
        const min = Math.min(...data);
        const max = Math.max(...data);
        return { min, max };
    };

    const ecgYLimits = getYLimits(ecgData);
    const heartRateYLimits = getYLimits(heartRateData);

    const getCombinedYLimits = (leftData, rightData) => {
        const combinedData = [...leftData, ...rightData];
        if (combinedData.length === 0) return { min: 0, max: 1 }; // Default limits if no data
        const min = Math.min(...combinedData);
        const max = Math.max(...combinedData);
        return { min, max };
    };
    const respYLimits = getCombinedYLimits(respLData, respRData);
    
    const respRRYLimits = getCombinedYLimits(leftRRData, rightRRData);

    const chartOptions = {
        responsive: true,
        animation: {
            duration: 0
        },
        scales: {
            y: {
                beginAtZero: false,
                min: Math.min(ecgYLimits.min, heartRateYLimits.min),
                max: Math.max(ecgYLimits.max, heartRateYLimits.max),
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'white'
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'white'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: 'white'
                }
            }
        }
    };

    return (
        <div style={{ 
            padding: '20px', 
            backgroundColor: '#202124', 
            minHeight: '100vh', 
            color: 'white',
            overflowY: 'auto'
        }}>
            <h2 style={{ marginBottom: '20px' }}>Vitals Chart</h2>
            
            <div style={{ 
                marginBottom: '30px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '20px',
                borderRadius: '10px'
            }}>
                <h3>Heart Rate</h3>
                <Line 
                    data={{
                        labels: Array(heartRateData.length).fill(''),
                        datasets: [{
                            label: 'Heart Rate (BPM)',
                            data: heartRateData,
                            borderColor: 'rgb(255, 99, 132)',
                            tension: 0.4
                        }]
                    }}
                    options={{
                        ...chartOptions,
                        scales: {
                            ...chartOptions.scales,
                            y: {
                                ...chartOptions.scales.y,
                                min: heartRateYLimits.min, // Use heart rate min
                                max: heartRateYLimits.max  // Use heart rate max
                            }
                        }
                    }}
                    
                />
            </div>

            <div style={{ 
                marginBottom: '30px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '20px',
                borderRadius: '10px'
            }}>
                <h3>ECG Signal</h3>
                <Line 
                    data={{
                        labels: Array(ecgData.length).fill(''),
                        datasets: [{
                            label: 'ECG',
                            data: ecgData,
                            borderColor: 'rgb(54, 162, 235)',
                            tension: 0,
                            pointRadius: 0,
                            borderWidth: 1
                        }]
                    }}
                    options={{
                        ...chartOptions,
                        scales: {
                            ...chartOptions.scales,
                            y: {
                                ...chartOptions.scales.y,
                                min: ecgYLimits.min, // Use ECG min
                                max: ecgYLimits.max  // Use ECG max
                            }
                        }
                    }}
                    
                />
            </div>

            <div style={{ 
                marginBottom: '30px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '20px',
                borderRadius: '10px'
            }}>
                <h3>Respiratory Signals</h3>
                <Line 
                    data={{
                        labels: Array(respLData.length).fill(''),
                        datasets: [
                            {
                                label: 'Left Respiratory Signal',
                                data: respLData,
                                borderColor: 'rgb(75, 192, 192)',
                                tension: 0.4,
                                pointRadius: 0
                            },
                            {
                                label: 'Right Respiratory Signal',
                                data: respRData,
                                borderColor: 'rgb(153, 102, 255)',
                                tension: 0.4,
                                pointRadius: 0
                            }
                        ]
                    }}
                    options={{
                        ...chartOptions,
                        scales: {
                            ...chartOptions.scales,
                            y: {
                                ...chartOptions.scales.y,
                                min: respYLimits.min, // Use combined min
                                max: respYLimits.max  // Use combined max
                            }
                        }
                    }}
                />

            </div>

            <div style={{ 
                marginBottom: '30px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '20px',
                borderRadius: '10px'
            }}>
                <h3>Respiratory Rate</h3>
                <Line 
                    data={{
                        labels: Array(leftRRData.length).fill(''),
                        datasets: [
                            {
                                label: 'Left Nostril RR',
                                data: leftRRData,
                                borderColor: 'rgb(75, 192, 192)',
                                tension: 0.4
                            },
                            {
                                label: 'Right Nostril RR',
                                data: rightRRData,
                                borderColor: 'rgb(153, 102, 255)',
                                tension: 0.4
                            }
                        ]
                    }}
                    options={{
                        ...chartOptions,
                        scales: {
                            ...chartOptions.scales,
                            y: {
                                ...chartOptions.scales.y,
                                min: respRRYLimits.min, // Use combined min
                                max: respRRYLimits.max  // Use combined max
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default VitalsChart;