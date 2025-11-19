// KELOMPOK GACORRR - ALGORITMA GENETICA
// Tugas Mata Kuliah Kecerdasan Buatan

class GeneticEquationSolver {
    constructor() {
        this.population = [];
        this.bestSolution = null;
        this.bestFitness = 0;
        this.generation = 0;
        this.fitnessHistory = [];
        this.startTime = 0;
    }

    // Parse persamaan dari input text
    parseEquations(input) {
        const lines = input.split('\n').filter(line => line.trim());
        const equations = [];
        const variables = new Set();

        lines.forEach(line => {
            const [left, right] = line.split('=').map(s => s.trim());
            const constant = parseFloat(right);
            
            // Extract coefficients and variables
            const terms = left.split(/[+-]/).map(term => term.trim());
            const equation = { coefficients: {}, constant };
            
            terms.forEach(term => {
                if (term) {
                    const match = term.match(/([-+]?\d*\.?\d*)([a-z])?/i);
                    if (match) {
                        let coefficient = match[1];
                        const variable = match[2];
                        
                        if (coefficient === '' || coefficient === '+') coefficient = '1';
                        if (coefficient === '-') coefficient = '-1';
                        
                        const coeffValue = parseFloat(coefficient) || 1;
                        
                        if (variable) {
                            equation.coefficients[variable] = (equation.coefficients[variable] || 0) + coeffValue;
                            variables.add(variable);
                        } else {
                            equation.constant -= coeffValue;
                        }
                    }
                }
            });
            
            equations.push(equation);
        });

        return { equations, variables: Array.from(variables) };
    }

    // Inisialisasi populasi acak
    initializePopulation(populationSize, variables) {
        this.population = [];
        for (let i = 0; i < populationSize; i++) {
            const chromosome = {};
            variables.forEach(variable => {
                chromosome[variable] = (Math.random() - 0.5) * 20; // Nilai antara -10 sampai 10
            });
            this.population.push(chromosome);
        }
    }

    // Fungsi fitness - menghitung seberapa baik solusi memenuhi persamaan
    calculateFitness(chromosome, equations) {
        let totalError = 0;
        
        equations.forEach(equation => {
            let leftSideValue = 0;
            
            // Hitung nilai sisi kiri persamaan
            Object.entries(equation.coefficients).forEach(([variable, coefficient]) => {
                leftSideValue += coefficient * (chromosome[variable] || 0);
            });
            
            // Error = selisih antara sisi kiri dan kanan
            const error = Math.abs(leftSideValue - equation.constant);
            totalError += error;
        });
        
        // Fitness lebih tinggi = error lebih kecil
        return 1 / (1 + totalError);
    }

    // Seleksi orang tua menggunakan tournament selection
    selectParent(equations) {
        const tournamentSize = 5;
        let best = null;
        let bestFitness = -1;
        
        for (let i = 0; i < tournamentSize; i++) {
            const candidate = this.population[Math.floor(Math.random() * this.population.length)];
            const fitness = this.calculateFitness(candidate, equations);
            
            if (fitness > bestFitness) {
                bestFitness = fitness;
                best = candidate;
            }
        }
        
        return best;
    }

    // Crossover - menghasilkan anak dari dua orang tua
    crossover(parent1, parent2, variables) {
        const child = {};
        const alpha = Math.random(); // BLX-alpha crossover
        
        variables.forEach(variable => {
            const minVal = Math.min(parent1[variable], parent2[variable]);
            const maxVal = Math.max(parent1[variable], parent2[variable]);
            const range = maxVal - minVal;
            
            child[variable] = minVal + (Math.random() * (1 + 2 * alpha) - alpha) * range;
        });
        
        return child;
    }

    // Mutasi - mengubah nilai variabel secara acak
    mutate(chromosome, mutationRate, variables) {
        const mutated = {...chromosome};
        
        variables.forEach(variable => {
            if (Math.random() < mutationRate) {
                mutated[variable] += (Math.random() - 0.5) * 4; // Mutasi kecil
            }
        });
        
        return mutated;
    }

    // Evolusi satu generasi
    evolveGeneration(equations, variables, mutationRate) {
        const newPopulation = [];
        
        // Elitism - pertahankan solusi terbaik
        newPopulation.push({...this.bestSolution});
        
        // Generate populasi baru
        while (newPopulation.length < this.population.length) {
            const parent1 = this.selectParent(equations);
            const parent2 = this.selectParent(equations);
            let child = this.crossover(parent1, parent2, variables);
            child = this.mutate(child, mutationRate, variables);
            newPopulation.push(child);
        }
        
        this.population = newPopulation;
        this.generation++;
    }

    // Solver utama
    solve(input, populationSize, maxGenerations, mutationRate) {
        this.startTime = performance.now();
        this.generation = 0;
        this.fitnessHistory = [];
        
        // Parse input
        const { equations, variables } = this.parseEquations(input);
        
        if (variables.length === 0) {
            throw new Error('Tidak ada variabel yang ditemukan dalam persamaan');
        }
        
        // Inisialisasi populasi
        this.initializePopulation(pulationSize, variables);
        
        // Evolusi
        for (let gen = 0; gen < maxGenerations; gen++) {
            // Evaluasi fitness
            let generationBestFitness = 0;
            let generationBestSolution = null;
            
            this.population.forEach(chromosome => {
                const fitness = this.calculateFitness(chromosome, equations);
                
                if (fitness > generationBestFitness) {
                    generationBestFitness = fitness;
                    generationBestSolution = {...chromosome};
                }
            });
            
            // Update solusi terbaik global
            if (generationBestFitness > this.bestFitness) {
                this.bestFitness = generationBestFitness;
                this.bestSolution = generationBestSolution;
            }
            
            this.fitnessHistory.push(this.bestFitness);
            
            // Update UI
            this.updateProgress(gen, maxGenerations);
            
            // Cek konvergensi
            if (this.bestFitness > 0.999) {
                break;
            }
            
            // Evolusi ke generasi berikutnya
            this.evolveGeneration(equations, variables, mutationRate);
        }
        
        return this.bestSolution;
    }

    // Update progress di UI
    updateProgress(currentGen, maxGenerations) {
        const progress = (currentGen / maxGenerations) * 100;
        const progressFill = document.getElementById('progressFill');
        const generationInfo = document.getElementById('generationInfo');
        const currentGenElement = document.getElementById('currentGen');
        const bestFitnessElement = document.getElementById('bestFitness');
        const currentErrorElement = document.getElementById('currentError');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (generationInfo) generationInfo.textContent = `Generasi ${currentGen}/${maxGenerations}`;
        if (currentGenElement) currentGenElement.textContent = currentGen;
        if (bestFitnessElement) bestFitnessElement.textContent = this.bestFitness.toFixed(4);
        if (currentErrorElement) {
            const error = (1 - this.bestFitness).toFixed(6);
            currentErrorElement.textContent = error;
        }
    }

    // Hitung waktu penyelesaian
    getSolveTime() {
        return (performance.now() - this.startTime).toFixed(2);
    }

    // Visualisasi konvergensi
    drawConvergenceChart() {
        const canvas = document.getElementById('convergenceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (this.fitnessHistory.length === 0) return;
        
        // Setup grafik
        const padding = 40;
        const graphWidth = width - 2 * padding;
        const graphHeight = height - 2 * padding;
        
        // Draw axes
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw fitness line
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.fitnessHistory.forEach((fitness, index) => {
            const x = padding + (index / (this.fitnessHistory.length - 1)) * graphWidth;
            const y = height - padding - (fitness * graphHeight);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Generasi', width / 2, height - 10);
        ctx.save();
        ctx.translate(10, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Fitness', 0, 0);
        ctx.restore();
    }
}

// Instance solver
const solver = new GeneticEquationSolver();

// Fungsi utama untuk menyelesaikan persamaan
function solveEquations() {
    try {
        const equationInput = document.getElementById('equationInput').value;
        const populationSize = parseInt(document.getElementById('populationSize').value);
        const maxGenerations = parseInt(document.getElementById('maxGenerations').value);
        const mutationRate = parseFloat(document.getElementById('mutationRate').value);
        
        const solution = solver.solve(equationInput, populationSize, maxGenerations, mutationRate);
        
        // Display results
        displaySolution(solution, solver.bestFitness, solver.getSolveTime());
        solver.drawConvergenceChart();
        
        // Update waktu
        document.getElementById('solveTime').textContent = `${solver.getSolveTime()}ms`;
        
    } catch (error) {
        document.getElementById('solutionDisplay').innerHTML = 
            `<p style="color: #e53e3e;">Error: ${error.message}</p>`;
    }
}

// Menampilkan solusi
function displaySolution(solution, fitness, solveTime) {
    const solutionDisplay = document.getElementById('solutionDisplay');
    
    if (!solution) {
        solutionDisplay.innerHTML = '<p>Tidak ditemukan solusi yang memadai</p>';
        return;
    }
    
    let html = '<div class="solution-result">';
    html += '<h3>✅ Solusi Ditemukan!</h3>';
    
    Object.entries(solution).forEach(([variable, value]) => {
        html += `<p><strong>${variable}</strong> = ${value.toFixed(6)}</p>`;
    });
    
    html += `<div class="solution-stats">`;
    html += `<p><strong>Fitness:</strong> ${fitness.toFixed(6)}</p>`;
    html += `<p><strong>Error:</strong> ${(1 - fitness).toFixed(6)}</p>`;
    html += `<p><strong>Waktu:</strong> ${solveTime} ms</p>`;
    html += `<p><strong>Generasi:</strong> ${solver.generation}</p>`;
    html += `</div>`;
    
    // Verifikasi solusi
    html += `<div class="verification">`;
    html += `<h4>Verifikasi:</h4>`;
    
    const { equations } = solver.parseEquations(document.getElementById('equationInput').value);
    equations.forEach((equation, idx) => {
        let leftSide = 0;
        Object.entries(equation.coefficients).forEach(([variable, coefficient]) => {
            leftSide += coefficient * solution[variable];
        });
        const error = Math.abs(leftSide - equation.constant);
        html += `<p>Persamaan ${idx + 1}: ${leftSide.toFixed(4)} ≈ ${equation.constant} (error: ${error.toFixed(6)})</p>`;
    });
    
    html += `</div></div>`;
    
    solutionDisplay.innerHTML = html;
}

// Event listener untuk input enter
document.getElementById('equationInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        solveEquations();
    }
});

// Initialize dengan contoh
window.addEventListener('load', function() {
    solver.drawConvergenceChart();
});

// KETERANGAN KELOMPOK GACORRR:
/*
ANGGOTA KELOMPOK:
1. [Nama Lengkap] - [NIM] - Sebagai Ketua
2. [Nama Lengkap] - [NIM] - Anggota
3. [Nama Lengkap] - [NIM] - Anggota  
4. [Nama Lengkap] - [NIM] - Anggota

DESKRIPSI TUGAS:
Website ini mengimplementasikan Algoritma Genetika untuk menyelesaikan
sistem persamaan linear. Algoritma bekerja dengan mensimulasikan proses
evolusi untuk menemukan solusi optimal.

FITUR UTAMA:
- Penyelesaian sistem persamaan linear multiple variable
- Visualisasi proses konvergensi
- Parameter yang dapat disesuaikan
- Verifikasi solusi
- UI yang responsive dan user-friendly

CARA PENGGUNAAN:
1. Masukkan persamaan di textarea (format: 2x + 3y = 12)
2. Atur parameter GA sesuai kebutuhan
3. Klik "Solve dengan Algoritma Genetika"
4. Lihat solusi dan proses evolusi

TEKNOLOGI:
- HTML5, CSS3, JavaScript ES6
- Canvas API untuk visualisasi
- Pure JavaScript tanpa library external
*/
