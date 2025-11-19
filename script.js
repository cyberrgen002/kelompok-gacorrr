// KELOMPOK GACORRR - ALGORITMA GENETIKA
// Tugas Mata Kuliah - Knapsack Problem Solver

class KnapsackGeneticSolver {
    constructor() {
        this.population = [];
        this.bestSolution = null;
        this.bestFitness = 0;
        this.generation = 0;
        this.fitnessHistory = [];
        this.valueHistory = [];
        this.startTime = 0;
        this.items = [];
    }

    // Inisialisasi populasi acak
    initializePopulation(populationSize, numItems) {
        this.population = [];
        for (let i = 0; i < populationSize; i++) {
            const chromosome = Array(numItems).fill(0).map(() => Math.random() > 0.5 ? 1 : 0);
            this.population.push(chromosome);
        }
    }

    // Fungsi fitness - menghitung total nilai dengan penalty untuk overload
    calculateFitness(chromosome, items, capacity) {
        let totalValue = 0;
        let totalWeight = 0;
        
        // Hitung total nilai dan berat
        chromosome.forEach((gene, index) => {
            if (gene === 1) {
                totalValue += items[index].value;
                totalWeight += items[index].weight;
            }
        });
        
        // Penalty jika melebihi kapasitas
        if (totalWeight > capacity) {
            // Penalty proportional dengan kelebihan berat
            const overload = totalWeight - capacity;
            totalValue = Math.max(0, totalValue - (overload * 10)); // Penalty besar
        }
        
        return {
            fitness: totalValue,
            totalValue: totalValue,
            totalWeight: totalWeight,
            isValid: totalWeight <= capacity
        };
    }

    // Seleksi orang tua menggunakan tournament selection
    selectParent(items, capacity) {
        const tournamentSize = 3;
        let best = null;
        let bestFitness = -1;
        
        for (let i = 0; i < tournamentSize; i++) {
            const candidate = this.population[Math.floor(Math.random() * this.population.length)];
            const fitnessResult = this.calculateFitness(candidate, items, capacity);
            
            if (fitnessResult.fitness > bestFitness) {
                bestFitness = fitnessResult.fitness;
                best = candidate;
            }
        }
        
        return best;
    }

    // Crossover single-point
    crossover(parent1, parent2, crossoverRate) {
        if (Math.random() > crossoverRate) {
            return [parent1.slice(), parent2.slice()];
        }
        
        const crossoverPoint = Math.floor(Math.random() * parent1.length);
        const child1 = [
            ...parent1.slice(0, crossoverPoint),
            ...parent2.slice(crossoverPoint)
        ];
        const child2 = [
            ...parent2.slice(0, crossoverPoint),
            ...parent1.slice(crossoverPoint)
        ];
        
        return [child1, child2];
    }

    // Mutasi - flip bit
    mutate(chromosome, mutationRate) {
        return chromosome.map(gene => {
            if (Math.random() < mutationRate) {
                return gene === 1 ? 0 : 1;
            }
            return gene;
        });
    }

    // Evolusi satu generasi
    evolveGeneration(items, capacity, mutationRate, crossoverRate, elitismCount = 1) {
        const newPopulation = [];
        const populationSize = this.population.length;
        
        // Evaluasi fitness seluruh populasi
        const populationWithFitness = this.population.map(chromosome => ({
            chromosome,
            fitness: this.calculateFitness(chromosome, items, capacity)
        }));
        
        // Urutkan berdasarkan fitness (descending)
        populationWithFitness.sort((a, b) => b.fitness.fitness - a.fitness.fitness);
        
        // Elitism - pertahankan solusi terbaik
        for (let i = 0; i < elitismCount; i++) {
            newPopulation.push(populationWithFitness[i].chromosome);
        }
        
        // Generate populasi baru
        while (newPopulation.length < populationSize) {
            const parent1 = this.selectParent(items, capacity);
            const parent2 = this.selectParent(items, capacity);
            const [child1, child2] = this.crossover(parent1, parent2, crossoverRate);
            
            newPopulation.push(this.mutate(child1, mutationRate));
            if (newPopulation.length < populationSize) {
                newPopulation.push(this.mutate(child2, mutationRate));
            }
        }
        
        this.population = newPopulation;
        this.generation++;
        
        // Update solusi terbaik
        const bestInGeneration = populationWithFitness[0];
        if (bestInGeneration.fitness.fitness > this.bestFitness) {
            this.bestFitness = bestInGeneration.fitness.fitness;
            this.bestSolution = bestInGeneration.chromosome;
        }
        
        return bestInGeneration;
    }

    // Solver utama
    solve(items, capacity, populationSize, maxGenerations, mutationRate, crossoverRate) {
        this.startTime = performance.now();
        this.generation = 0;
        this.fitnessHistory = [];
        this.valueHistory = [];
        this.items = items;
        
        if (items.length === 0) {
            throw new Error('Tidak ada barang yang dimasukkan');
        }
        
        // Inisialisasi populasi
        this.initializePopulation(populationSize, items.length);
        
        // Evolusi
        for (let gen = 0; gen < maxGenerations; gen++) {
            const bestInGeneration = this.evolveGeneration(
                items, capacity, mutationRate, crossoverRate
            );
            
            this.fitnessHistory.push(bestInGeneration.fitness.fitness);
            this.valueHistory.push(bestInGeneration.fitness.totalValue);
            
            // Update UI
            this.updateProgress(gen, maxGenerations, bestInGeneration.fitness);
            
            // Cek konvergensi dini
            if (this.shouldStopEarly()) {
                break;
            }
        }
        
        return this.getBestSolutionDetails();
    }

    // Cek apakah harus berhenti lebih awal (konvergensi)
    shouldStopEarly() {
        if (this.fitnessHistory.length < 20) return false;
        
        // Cek apakah fitness tidak membaik dalam 20 generasi terakhir
        const recentHistory = this.fitnessHistory.slice(-20);
        const maxRecent = Math.max(...recentHistory);
        const minRecent = Math.min(...recentHistory);
        
        return (maxRecent - minRecent) < 1; // Perubahan sangat kecil
    }

    // Dapatkan detail solusi terbaik
    getBestSolutionDetails() {
        if (!this.bestSolution) return null;
        
        const capacity = parseInt(document.getElementById('knapsackCapacity').value);
        const fitnessResult = this.calculateFitness(this.bestSolution, this.items, capacity);
        
        return {
            chromosome: this.bestSolution,
            totalValue: fitnessResult.totalValue,
            totalWeight: fitnessResult.totalWeight,
            isValid: fitnessResult.isValid,
            items: this.items.map((item, index) => ({
                ...item,
                selected: this.bestSolution[index] === 1
            }))
        };
    }

    // Update progress di UI
    updateProgress(currentGen, maxGenerations, fitnessResult) {
        const progress = (currentGen / maxGenerations) * 100;
        const progressFill = document.getElementById('progressFill');
        const generationInfo = document.getElementById('generationInfo');
        const currentGenElement = document.getElementById('currentGen');
        const bestValueElement = document.getElementById('bestValue');
        const totalWeightElement = document.getElementById('totalWeight');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (generationInfo) generationInfo.textContent = `Generasi ${currentGen}/${maxGenerations}`;
        if (currentGenElement) currentGenElement.textContent = currentGen;
        if (bestValueElement) bestValueElement.textContent = fitnessResult.totalValue;
        if (totalWeightElement) totalWeightElement.textContent = `${fitnessResult.totalWeight} kg`;
    }

    // Hitung waktu penyelesaian
    getSolveTime() {
        return (performance.now() - this.startTime).toFixed(2);
    }

    // Visualisasi konvergensi
    drawConvergenceChart() {
        const canvas = document.getElementById('convergenceChart');
        if (!canvas || this.fitnessHistory.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
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
        const maxFitness = Math.max(...this.fitnessHistory);
        const minFitness = Math.min(...this.fitnessHistory);
        const range = maxFitness - minFitness || 1;
        
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.fitnessHistory.forEach((fitness, index) => {
            const x = padding + (index / (this.fitnessHistory.length - 1)) * graphWidth;
            const y = height - padding - ((fitness - minFitness) / range) * graphHeight;
            
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
        
        // Draw value points
        ctx.fillStyle = '#48bb78';
        this.valueHistory.forEach((value, index) => {
            if (value > 0) { // Hanya draw nilai valid
                const x = padding + (index / (this.valueHistory.length - 1)) * graphWidth;
                const y = height - padding - ((value - minFitness) / range) * graphHeight;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }
}

// Instance solver
const solver = new KnapsackGeneticSolver();

// Data barang default
let items = [
    { name: "Laptop", weight: 3, value: 800 },
    { name: "Kamera", weight: 2, value: 500 },
    { name: "Buku", weight: 1, value: 50 },
    { name: "Botol Air", weight: 1, value: 10 },
    { name: "Jaket", weight: 2, value: 100 },
    { name: "Powerbank", weight: 1, value: 80 }
];

// Initialize items list
function initializeItems() {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';
    
    items.forEach((item, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <input type="text" value="${item.name}" placeholder="Nama barang" 
                   onchange="updateItem(${index}, 'name', this.value)">
            <input type="number" value="${item.weight}" placeholder="Berat" 
                   onchange="updateItem(${index}, 'weight', parseFloat(this.value))">
            <input type="number" value="${item.value}" placeholder="Nilai" 
                   onchange="updateItem(${index}, 'value', parseFloat(this.value))">
            <span>Ratio: ${(item.value / item.weight).toFixed(2)}</span>
            <button class="remove-item" onclick="removeItem(${index})">×</button>
        `;
        itemsList.appendChild(itemRow);
    });
}

// Update item data
function updateItem(index, property, value) {
    items[index][property] = value;
    // Update ratio display
    const itemRow = document.querySelectorAll('.item-row')[index];
    const ratioSpan = itemRow.querySelector('span');
    ratioSpan.textContent = `Ratio: ${(items[index].value / items[index].weight).toFixed(2)}`;
}

// Remove item
function removeItem(index) {
    if (items.length > 1) {
        items.splice(index, 1);
        initializeItems();
    } else {
        alert('Minimal harus ada 1 barang');
    }
}

// Add new item
function addItem() {
    items.push({
        name: `Barang ${items.length + 1}`,
        weight: 1,
        value: 50
    });
    initializeItems();
}

// Fungsi utama untuk menyelesaikan masalah ransel
function solveKnapsack() {
    try {
        const capacity = parseInt(document.getElementById('knapsackCapacity').value);
        const populationSize = parseInt(document.getElementById('populationSize').value);
        const maxGenerations = parseInt(document.getElementById('maxGenerations').value);
        const mutationRate = parseFloat(document.getElementById('mutationRate').value);
        const crossoverRate = parseFloat(document.getElementById('crossoverRate').value);
        
        const solution = solver.solve(items, capacity, populationSize, maxGenerations, mutationRate, crossoverRate);
        
        // Display results
        displaySolution(solution, solver.getSolveTime());
        solver.drawConvergenceChart();
        
        // Update waktu
        document.getElementById('solveTime').textContent = `${solver.getSolveTime()}ms`;
        
    } catch (error) {
        document.getElementById('solutionDisplay').innerHTML = 
            `<p style="color: #e53e3e;">Error: ${error.message}</p>`;
    }
}

// Menampilkan solusi
function displaySolution(solution, solveTime) {
    const solutionDisplay = document.getElementById('solutionDisplay');
    const solutionDetails = document.getElementById('solutionDetails');
    
    if (!solution) {
        solutionDisplay.innerHTML = '<p>Tidak ditemukan solusi yang memadai</p>';
        return;
    }
    
    // Display summary
    let html = '<div class="solution-result">';
    html += `<h3>✅ ${solution.isValid ? 'SOLUSI OPTIMAL DITEMUKAN!' : 'Solusi (melebihi kapasitas)'}</h3>`;
    html += `<p><strong>Total Nilai:</strong> ${solution.totalValue}</p>`;
    html += `<p><strong>Total Berat:</strong> ${solution.totalWeight} kg / ${document.getElementById('knapsackCapacity').value} kg</p>`;
    html += `<p><strong>Jumlah Barang:</strong> ${solution.items.filter(item => item.selected).length} dari ${items.length}</p>`;
    html += `<p><strong>Waktu:</strong> ${solveTime} ms</p>`;
    html += `<p><strong>Generasi:</strong> ${solver.generation}</p>`;
    html += `</div>`;
    
    solutionDisplay.innerHTML = html
