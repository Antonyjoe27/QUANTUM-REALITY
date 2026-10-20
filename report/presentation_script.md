# QUANTUM REALITY — PRESENTATION SCRIPT
## Oral Presentation and Defense Guide for the Internal Assessment (IA)

**Project Title**: QUANTUM REALITY — Decoherence Study of a Quantum Walk  
**Subtitle**: Phase Damping on the Coin Operation of a Discrete-Time Quantum Walk on a 1D Line  
**Target Duration**: 8 to 10 minutes  
**Visual Style**: Obsidian & Champagne Gold  
**Slide Deck File**: `report/Quantum_Reality_IA_Presentation.pptx`

---

## Slide 1: Title and Assigned Research Problem
- **Slide Reference**: Title Slide (`#101112` Obsidian background, `#D9BD87` Gold lettering)
- **Target Time**: 0:00 – 0:45
- **Presenter Spoken Script**:
  > "Good morning. Today I am presenting **QUANTUM REALITY**, an Internal Assessment research project investigating the decoherence of a discrete-time quantum walk.
  > 
  > Our assigned research problem is:
  > *'Decoherence study: Add dephasing or depolarizing noise to the coin operation of a quantum walk. Show how the distribution moves from quantum (two-peaked, spread out) to classical (Gaussian), and quantify using the standard deviation.'*
  > 
  > In this investigation, we developed a full computational pipeline: a Qiskit density-matrix quantum simulation backend, verified numerical tensor references, and an interactive 3D laboratory workbench built in Blender and React Three Fiber to visualize the transition in real time."

---

## Slide 2: Motivation & Scientific Objectives
- **Slide Reference**: Card layout with Scientific Context and Key Research Questions
- **Target Time**: 0:45 – 1:45
- **Presenter Spoken Script**:
  > "Why study decoherence in quantum walks? 
  > 
  > Quantum walks represent the quantum analogue of classical Markovian random walks, forming the algorithmic core of quantum graph searching, spatial search, and quantum transport simulation. In an ideal closed system, quantum walks exhibit **ballistic spreading**: quantum interference between distinct paths allows the probability distribution to expand with standard deviation linearly proportional to time, $\sigma(t) \propto t$. This yields a quadratic speedup over classical random walks, which spread diffusively with $\sigma(t) \propto \sqrt{t}$.
  > 
  > However, real quantum hardware is never fully isolated. Qubits inevitably couple to their environment, introducing decoherence. Our research objective is to examine how phase damping noise specifically applied to the quantum coin operator degrades quantum coherence, how the characteristic two-peaked distribution transforms into a unimodal classical distribution, and how standard deviation and total variation distance quantify this transition."

---

## Slide 3: Mathematical Model — 1D Discrete-Time Quantum Walk
- **Slide Reference**: State Space & Initialization; Evolution Operator Cards
- **Target Time**: 1:45 – 2:50
- **Presenter Spoken Script**:
  > "Let us examine our physical and mathematical formulation.
  > 
  > The total state space lives in the Hilbert space $\mathcal{H} = \mathcal{H}_{\text{coin}} \otimes \mathcal{H}_{\text{position}}$. The coin is a single two-level qubit spanned by $\{|0\rangle, |1\rangle\}$, while the position space is a one-dimensional lattice of integer sites $|x\rangle$. In our backend, we encode 128 lattice sites across 7 position qubits, setting the origin $x=0$ at binary index 64.
  > 
  > For the initial state, we prepare the coin in the symmetric superposition:
  > $$|\psi_c(0)\rangle = \frac{|0\rangle + i|1\rangle}{\sqrt{2}}$$
  > The $\pi/2$ relative phase factor is mathematically crucial: it eliminates spatial bias and ensures that the probability distribution remains strictly symmetric, $P(x, t) = P(-x, t)$, with an exact mean position $\mu(t) = 0.0$ for all timesteps.
  > 
  > At each discrete timestep, we apply the evolution operator $U = S \cdot (I \otimes H)$. First, the Hadamard operator $H$ puts the coin into superposition. Second, the conditional shift operator $S$ translates the walker: if the coin is $|0\rangle$, the walker steps right, $x \to x+1$; if $|1\rangle$, the walker steps left, $x \to x-1$."

---

## Slide 4: Decoherence Mechanism — Phase Damping & Kraus Superoperators
- **Slide Reference**: Kraus Representation; Full Step Sequence & Regimes
- **Target Time**: 2:50 – 4:00
- **Presenter Spoken Script**:
  > "To model environmental decoherence, we introduce phase damping on the coin qubit immediately after the Hadamard gate.
  > 
  > In the Kraus representation of open quantum systems, this quantum channel $\mathcal{E}$ is parameterized by the noise strength $p \in [0, 1]$ with operators:
  > $$K_0 = \begin{pmatrix} 1 & 0 \\ 0 & \sqrt{1 - p} \end{pmatrix}, \quad K_1 = \begin{pmatrix} 0 & 0 \\ 0 & \sqrt{p} \end{pmatrix}$$
  > These satisfy the completeness condition $K_0^\dagger K_0 + K_1^\dagger K_1 = I_2$.
  > 
  > Under this channel, diagonal density matrix elements are preserved, meaning energy populations do not decay. However, the off-diagonal coherences $\rho_{01}$ and $\rho_{10}$ are multiplied by $\sqrt{1 - p}$.
  > 
  > This yields three distinct regimes:
  > 1. At $p = 0.00$, $\sqrt{1 - p} = 1$: coherence is fully preserved, giving the ideal ballistic quantum walk.
  > 2. For $0 < p < 1.00$: off-diagonal terms decay progressively at each timestep.
  > 3. At $p = 1.00$, $\sqrt{1 - p} = 0$: all off-diagonal coin coherences are completely extinguished. The coin acts as an uncorrelated classical 50/50 coin toss, reproducing the classical random walk exactly."

---

## Slide 5: System Architecture & Interactive 3D Workbench
- **Slide Reference**: Computational Stack; 3D Workbench Interface
- **Target Time**: 4:00 – 4:55
- **Presenter Spoken Script**:
  > "To simulate and present this system, we built a modern software architecture.
  > 
  > The computational engine is implemented in Python and FastAPI, using Qiskit Aer's density matrix simulator across 8 qubits (1 coin qubit and 7 position qubits). Because we compute density matrices directly, our simulations are exact superoperator evolutions, completely free from stochastic shot noise. We also verified our ideal results against an independent NumPy tensor reference, agreeing down to floating-point machine precision.
  > 
  > On the frontend, we created a custom 3D laboratory workbench in Blender 5.2.2 LTS, rendered using React Three Fiber. In compliance with strict scientific visualization standards:
  > - Parity-forbidden sites where $x \not\equiv t \pmod 2$ have zero probability and render as flush floor pads ($h=0$), avoiding false visual cues.
  > - Non-zero sites scale strictly with $P(x, t) \times 3.6$.
  > - The UI provides live SVG charts, crosshairs, timestep scrubbing, and JSON/CSV data export."

---

## Slide 6: Experimental Methodology & Validation Controls
- **Slide Reference**: Investigated Conditions; Validation Standards
- **Target Time**: 4:55 – 5:45
- **Presenter Spoken Script**:
  > "Our experimental procedure investigated 5 distinct noise strengths: $p \in \{0.00, 0.25, 0.50, 0.75, 1.00\}$ evolved up to $T = 40$ steps across 81 lattice sites from $x = -40$ to $+40$.
  > 
  > Every simulation is held to strict physical conservation laws:
  > - **Normalization**: $\sum_x P(x, t) = 1.000000$ to machine precision across all timesteps.
  > - **Spatial Parity**: Parity invariance holds strictly; probability is zero for forbidden nodes.
  > - **Spatial Symmetry**: Mean position $\mu(t) = 0.000000$ and $P(x, t) = P(-x, t)$ hold for all noise strengths.
  > - **Cross-Endpoint Agreement**: The $p=0$ decoherence simulation matches the independent ideal endpoint with maximum error less than $2 \times 10^{-16}$.
  > - **Automated Testing**: 123 automated pytest tests validate every mathematical property before data collection."

---

## Slide 7: Spatial Distribution Transition (Figure 1)
- **Slide Reference**: Embedded Figure 1 ($P(x, 40)$ for $p=0.0, 0.5, 1.0$)
- **Target Time**: 5:45 – 6:45
- **Presenter Spoken Script**:
  > "Here in Figure 1, we observe the core qualitative result of our investigation at $T = 40$.
  > 
  > Looking at the gold curve, $p = 0.00$: constructive interference pushes probability amplitude toward the wavefronts, creating two prominent outer ballistic peaks near $x \approx \pm t/\sqrt{2} \approx \pm 28$. Destructive interference creates a low-probability trough in the center.
  > 
  > As we increase noise to $p = 0.50$, shown in ochre: phase damping diminishes the path interference. The outer peaks decay, and probability redistributes toward the center.
  > 
  > Finally, at $p = 1.00$, shown in white: quantum interference is completely absent. The distribution collapses into a smooth, unimodal binomial envelope that aligns identically with the dashed classical random walk reference. This visually confirms the transition from a two-peaked quantum state to a classical binomial distribution."

---

## Slide 8: Quantitative Spreading & Standard Deviation (Figures 2 & 3)
- **Slide Reference**: Embedded Figures 2 & 3; Verified Numerical Table
- **Target Time**: 6:45 – 7:55
- **Presenter Spoken Script**:
  > "In Slide 8, we present the quantitative verification of the spreading behavior.
  > 
  > In Figure 2 on the left, we plot standard deviation $\sigma(t)$ as a function of discrete time:
  > - The top curve, $p = 0.00$, shows linear growth $\sigma(t) \propto t$. At $T = 40$, the standard deviation reaches **21.6586**, expanding 3.42 times faster than classical diffusion.
  > - As noise increases to $p = 0.25, 0.50,$ and $0.75$, the standard deviation at $T=40$ drops to **14.1240**, **10.2960**, and **7.9722**, respectively.
  > - At $p = 1.00$, the curve matches the classical theoretical reference $\sigma_{\text{classical}}(t) = \sqrt{t}$. At $T = 40$, the simulated value is **6.324555**, matching the exact theoretical value $\sqrt{40} = 6.324555$ down to six decimal places!
  > 
  > In Figure 3 on the right, we plot $\sigma(40)$ versus noise parameter $p$. The decay is continuous and monotonic, demonstrating the smooth suppression of ballistic transport toward the classical diffusion bound."

---

## Slide 9: Classical Convergence & Residual Analysis (Figures 4 & 5)
- **Slide Reference**: Embedded Figures 4 & 5; Total Variation Distance
- **Target Time**: 7:55 – 8:50
- **Presenter Spoken Script**:
  > "To rigorously prove convergence to classicality, we evaluated the Total Variation Distance:
  > $$TV(P_{\text{noisy}}, P_{\text{classical}}) = \frac{1}{2} \sum_x |P_{\text{noisy}}(x) - P_{\text{classical}}(x)|$$
  > In Figure 4, we see that $TV$ decreases smoothly from **0.7359** at $p = 0.00$ down to **0.000000** at $p = 1.00$. 
  > 
  > In Figure 5, we show the residual plot between the $p = 1.00$ decohered quantum walk and the analytical binomial reference. The maximum point-wise difference is below $10^{-15}$ across all 81 sites. 
  > 
  > It is important to note an academic subtlety: at finite time $T=40$, the exact classical limit is the discrete binomial distribution. By the de Moivre–Laplace theorem, this binomial distribution approaches a continuous Gaussian as $T \to \infty$. We avoid falsely claiming that finite-step distributions are continuous Gaussians, ensuring complete mathematical integrity."

---

## Slide 10: Limitations, Future Work & Conclusion
- **Slide Reference**: Computational Limitations; Conclusions & Extensions
- **Target Time**: 8:50 – 10:00
- **Presenter Spoken Script**:
  > "Finally, let us review our technology evaluation and limitations.
  > 
  > First, our simulations run on classical processors using Qiskit Aer density-matrix calculations. Density matrix simulation of $N$ qubits requires storing and updating $2^N \times 2^N$ matrices, which scales as $\mathcal{O}(4^N)$. Simulating 8 qubits requires $256 \times 256$ complex matrices, which is highly tractable, but scaling beyond 12 qubits would require statevector approximations or Monte Carlo shot sampling.
  > 
  > Second, we modeled Markovian phase damping on the coin qubit. On physical quantum computers, one also encounters spatial site dephasing, energy relaxation $T_1$, and gate crosstalk.
  > 
  > In conclusion:
  > - We have answered the assigned problem in full: demonstrating the shift from a two-peaked ballistic distribution to a classical binomial distribution.
  > - We quantified the transition using standard deviation ($\sigma$ drops from 21.66 to 6.32 at $T=40$) and total variation distance.
  > - All 123 automated tests pass, all data is genuine, and all scripts are 100% reproducible.
  > 
  > Thank you. I am now pleased to answer any questions."

---

## Potential Defense Questions & Model Answers

### Question 1: "Why choose $(|0\rangle + i|1\rangle)/\sqrt{2}$ instead of $(|0\rangle + |1\rangle)/\sqrt{2}$ as the initial coin state?"
**Answer**:
> "If we initialize the coin in $(|0\rangle + |1\rangle)/\sqrt{2}$ with the Hadamard coin, the Hadamard matrix creates an asymmetric superposition: $H|0\rangle = (|0\rangle + |1\rangle)/\sqrt{2}$ and $H|1\rangle = (|0\rangle - |1\rangle)/\sqrt{2}$. The relative minus sign causes constructive interference preferentially in the positive direction ($|0\rangle$), resulting in an asymmetric distribution with $\mu(t) > 0$. Introducing the $i$ phase factor ensures that both coin states experience symmetric interference magnitudes, guaranteeing $\mu(t) = 0$ and $P(x, t) = P(-x, t)$ for all $t$."

### Question 2: "Does Qiskit Aer make the simulation faster than a pure classical algorithm?"
**Answer**:
> "No. Qiskit Aer is a classical simulator running on a conventional CPU. Simulating quantum circuits on classical computers is computationally more demanding than simulating a classical random walk because it must maintain the full density matrix of $256 \times 256$ complex amplitudes. Qiskit is used because it provides the exact quantum gate abstractions, Kraus superoperator calculus, and circuit representation matching quantum information theory."

### Question 3: "Why is the Total Variation Distance exactly 0.000000 at $p = 1.00$?"
**Answer**:
> "At $p = 1.00$, the phase damping channel eliminates all off-diagonal terms of the coin density matrix after every Hadamard operation. Because the Hadamard matrix has entries with magnitude $1/\sqrt{2}$, setting off-diagonals to zero makes the coin state an equal probabilistic mixture of $|0\rangle$ and $|1\rangle$. The subsequent conditional shift then moves the walker left or right with independent 50% probability at each step, which is the exact definition of an unbiased classical random walk. Thus, the two distributions are mathematically identical."
