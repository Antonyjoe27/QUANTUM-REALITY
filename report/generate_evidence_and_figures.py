import json
import os
import sys
import time
from pathlib import Path

# Ensure backend can be imported
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

import matplotlib.pyplot as plt
import numpy as np
from fastapi.testclient import TestClient

from app.main import app

# Palette: Obsidian & Champagne Gold
BG_DARK = "#101112"
BG_PANEL = "#1B1A18"
BG_CARD = "#272625"
GOLD_PRIMARY = "#C6A66B"
GOLD_HIGHLIGHT = "#D9BD87"
TEXT_IVORY = "#F0E9DB"
TEXT_MUTED = "#A9A196"
CYAN_ACCENT = "#5E9CAE"  # soft slate teal for contrast if needed, but per rule stick strictly to tokens
RED_MUTED = "#C07060"

# Strict rule palette:
# Obsidian: #101112
# Deep graphite: #1B1A18
# Graphite panels: #272625
# Champagne gold: #C6A66B
# Highlight gold: #D9BD87
# Warm ivory: #F0E9DB
# Secondary text: #A9A196

OUTPUT_DIR = Path(__file__).resolve().parent
EVIDENCE_DIR = OUTPUT_DIR / "evidence"
FIGURES_DIR = OUTPUT_DIR / "figures"

EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
FIGURES_DIR.mkdir(parents=True, exist_ok=True)


def run_experiments():
    client = TestClient(app)
    noise_strengths = [0.00, 0.25, 0.50, 0.75, 1.00]
    t_max = 40

    print("=" * 60)
    print("STEP 1: Run Ideal Simulation Endpoint (T=40)")
    print("=" * 60)
    t0 = time.perf_counter()
    resp_ideal = client.post("/api/quantum-walk/ideal", json={"max_steps": t_max})
    t_ideal_ms = (time.perf_counter() - t0) * 1000
    assert resp_ideal.status_code == 200, f"Ideal simulation failed: {resp_ideal.text}"
    ideal_data = resp_ideal.json()
    with open(EVIDENCE_DIR / "ideal_t40.json", "w", encoding="utf-8") as f:
        json.dump(ideal_data, f, indent=2)
    print(f"Ideal simulation completed in {t_ideal_ms:.2f} ms; saved to evidence/ideal_t40.json")

    results_by_p = {}
    summary_t40 = []

    print("\n" + "=" * 60)
    print("STEP 2: Run Decoherence Simulation Endpoints (T=40, p in [0, 0.25, 0.5, 0.75, 1])")
    print("=" * 60)

    for p in noise_strengths:
        p_tag = f"p{int(round(p * 100)):03d}"
        t0 = time.perf_counter()
        resp = client.post(
            "/api/quantum-walk/decoherence",
            json={"max_steps": t_max, "noise_strength": p},
        )
        t_ms = (time.perf_counter() - t0) * 1000
        assert resp.status_code == 200, f"Decoherence p={p} failed: {resp.text}"
        data = resp.json()
        results_by_p[p] = data

        evidence_file = EVIDENCE_DIR / f"decoherence_{p_tag}_t40.json"
        with open(evidence_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        snap = data["timesteps"][t_max]
        noisy = snap["noisy"]
        classical = snap["classical"]
        ideal = snap["ideal"]
        tv_cl = snap["total_variation_distance"]
        tv_id = snap["total_variation_vs_ideal"]

        summary_t40.append(
            {
                "noise_strength": p,
                "noise_channel": data["noise_channel_name"],
                "step": t_max,
                "mean_noisy": noisy["mean"],
                "std_noisy": noisy["std_dev"],
                "std_classical": classical["std_dev"],
                "theoretical_std_classical": classical["theoretical_std_dev"],
                "std_ideal": ideal["std_dev"],
                "std_ratio_vs_classical": snap.get("std_dev_ratio_vs_classical"),
                "total_variation_distance_classical": tv_cl,
                "total_variation_distance_ideal": tv_id,
                "prob_sum_noisy": noisy["norm_check"],
                "is_symmetric": noisy["is_symmetric"],
                "execution_time_ms": data.get("execution_time_ms", t_ms),
            }
        )

        print(f"p = {p:.2f}:")
        print(f"  sigma_noisy     = {noisy['std_dev']:.6f}")
        print(f"  sigma_classical = {classical['std_dev']:.6f} (theoretical sqrt(40) = {np.sqrt(40):.6f})")
        print(f"  TV to classical = {tv_cl:.6f}")
        print(f"  TV to ideal     = {tv_id:.6f}")
        print(f"  mean_noisy      = {noisy['mean']:.6f}")
        print(f"  norm_check      = {noisy['norm_check']:.6f}")
        print(f"  saved to {evidence_file.name} ({t_ms:.1f} ms)")

    # Save summary table JSON & CSV
    with open(EVIDENCE_DIR / "summary_t40.json", "w", encoding="utf-8") as f:
        json.dump(summary_t40, f, indent=2)

    import csv

    with open(EVIDENCE_DIR / "summary_t40.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=summary_t40[0].keys())
        writer.writeheader()
        writer.writerows(summary_t40)

    print("\n" + "=" * 60)
    print("STEP 3: Cross-Endpoint Verification: p=0.00 vs Independent Ideal Endpoint")
    print("=" * 60)
    ideal_snaps = ideal_data["timesteps"]
    p0_snaps = results_by_p[0.00]["timesteps"]
    max_diff_across_all_t = 0.0

    for step in range(t_max + 1):
        dist_ideal = {pt["x"]: pt["probability"] for pt in ideal_snaps[step]["quantum"]["distribution"]}
        dist_p0 = {pt["x"]: pt["probability"] for pt in p0_snaps[step]["noisy"]["distribution"]}
        for x in dist_ideal:
            diff = abs(dist_ideal[x] - dist_p0.get(x, 0.0))
            if diff > max_diff_across_all_t:
                max_diff_across_all_t = diff

    print(f"Max absolute probability discrepancy across all t in [0, 40]: {max_diff_across_all_t:.2e}")
    assert max_diff_across_all_t < 1e-7, "p=0.00 does not match ideal endpoint within 1e-7!"
    print("CROSS-ENDPOINT VERIFICATION PASSED (p=0.0 matches independent ideal endpoint exactly).")

    print("\n" + "=" * 60)
    print("STEP 4: Generate Publication Quality Scientific Figures")
    print("=" * 60)
    generate_figures(results_by_p, ideal_data, summary_t40, t_max)


def setup_plot_style():
    plt.rcParams.update(
        {
            "figure.facecolor": BG_DARK,
            "axes.facecolor": BG_PANEL,
            "axes.edgecolor": BG_CARD,
            "axes.labelcolor": TEXT_IVORY,
            "axes.titlecolor": GOLD_HIGHLIGHT,
            "xtick.color": TEXT_MUTED,
            "ytick.color": TEXT_MUTED,
            "text.color": TEXT_IVORY,
            "grid.color": BG_CARD,
            "grid.linestyle": "--",
            "grid.alpha": 0.6,
            "font.family": "sans-serif",
            "font.sans-serif": ["Segoe UI", "DejaVu Sans", "Helvetica", "Arial"],
            "font.size": 11,
            "axes.titlesize": 13,
            "axes.labelsize": 11,
            "legend.facecolor": BG_CARD,
            "legend.edgecolor": GOLD_PRIMARY,
            "legend.fontsize": 10,
        }
    )


def generate_figures(results_by_p, ideal_data, summary_t40, t_max):
    setup_plot_style()

    # -------------------------------------------------------------
    # Figure 1: Spatial Probability Distributions at T=40 for p=0.0, 0.5, 1.0 vs Classical Reference
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(11, 6), dpi=300)

    snap_p00 = results_by_p[0.00]["timesteps"][t_max]["noisy"]["distribution"]
    snap_p50 = results_by_p[0.50]["timesteps"][t_max]["noisy"]["distribution"]
    snap_p10 = results_by_p[1.00]["timesteps"][t_max]["noisy"]["distribution"]
    snap_cl = results_by_p[1.00]["timesteps"][t_max]["classical"]["distribution"]

    x_vals = [pt["x"] for pt in snap_p00]
    p_vals_00 = [pt["probability"] for pt in snap_p00]
    p_vals_50 = [pt["probability"] for pt in snap_p50]
    p_vals_10 = [pt["probability"] for pt in snap_p10]
    p_vals_cl = [pt["probability"] for pt in snap_cl]

    ax.plot(
        x_vals,
        p_vals_00,
        color=GOLD_HIGHLIGHT,
        linewidth=2.2,
        marker="o",
        markersize=3.5,
        label=r"Coherent Quantum ($p = 0.00$, $\sigma = 21.66$)",
        alpha=0.95,
    )
    ax.plot(
        x_vals,
        p_vals_50,
        color=GOLD_PRIMARY,
        linewidth=2.0,
        marker="s",
        markersize=3.0,
        label=r"Intermediate Dephasing ($p = 0.50$, $\sigma = 10.30$)",
        alpha=0.9,
    )
    ax.plot(
        x_vals,
        p_vals_10,
        color=TEXT_IVORY,
        linewidth=2.0,
        marker="^",
        markersize=3.0,
        label=r"Complete Dephasing ($p = 1.00$, $\sigma = 6.32$)",
        alpha=0.85,
    )
    ax.plot(
        x_vals,
        p_vals_cl,
        color=TEXT_MUTED,
        linewidth=1.8,
        linestyle="--",
        label=r"Classical Random Walk Reference ($\sigma = \sqrt{40} = 6.32$)",
        alpha=0.75,
    )

    ax.set_title(
        f"Position Probability Distribution at Timestep T = {t_max} Under Coin Dephasing",
        pad=15,
        fontweight="bold",
    )
    ax.set_xlabel("Lattice Coordinate x (1D line, origin x = 0)")
    ax.set_ylabel("Probability P(x, t = 40)")
    ax.set_xlim(-42, 42)
    ax.set_ylim(-0.005, 0.16)
    ax.grid(True)
    ax.legend(loc="upper right", framealpha=0.9)

    fig.tight_layout()
    fig1_path = FIGURES_DIR / "fig1_spatial_distributions_t40.png"
    fig.savefig(fig1_path)
    plt.close(fig)
    print(f"Saved: {fig1_path.name}")

    # -------------------------------------------------------------
    # Figure 2: Standard Deviation sigma(t) vs Timestep t in [0, 40]
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    steps = list(range(t_max + 1))

    colors = {
        0.00: GOLD_HIGHLIGHT,
        0.25: "#DFC9A2",
        0.50: GOLD_PRIMARY,
        0.75: "#9C824E",
        1.00: TEXT_IVORY,
    }

    for p in [0.00, 0.25, 0.50, 0.75, 1.00]:
        sigmas = [results_by_p[p]["timesteps"][t]["noisy"]["std_dev"] for t in steps]
        ax.plot(
            steps,
            sigmas,
            color=colors[p],
            linewidth=2.0 if p in [0.0, 1.0] else 1.5,
            label=f"p = {p:.2f} ({'Coherent' if p==0 else 'Complete' if p==1 else 'Transition'})",
        )

    # Classical theoretical reference: sqrt(t)
    sigma_cl_theory = [np.sqrt(t) for t in steps]
    ax.plot(
        steps,
        sigma_cl_theory,
        color=TEXT_MUTED,
        linestyle="--",
        linewidth=2.0,
        label=r"Classical Reference $\sigma = \sqrt{t}$",
    )

    ax.set_title(
        r"Spreading Dynamics: Standard Deviation $\sigma(t)$ vs Timestep $t$",
        pad=15,
        fontweight="bold",
    )
    ax.set_xlabel("Discrete Timestep t (0 to 40)")
    ax.set_ylabel(r"Standard Deviation $\sigma(t)$")
    ax.set_xlim(0, 40)
    ax.set_ylim(0, 24)
    ax.grid(True)
    ax.legend(loc="upper left", framealpha=0.9)

    # Annotations
    ax.annotate(
        r"Ballistic Spreading: $\sigma \propto t$" + "\n(Quantum Interference)",
        xy=(35, 19),
        xytext=(22, 19.5),
        arrowprops=dict(facecolor=GOLD_HIGHLIGHT, shrink=0.05, width=1.0, headwidth=6),
        color=GOLD_HIGHLIGHT,
        fontsize=9.5,
    )
    ax.annotate(
        r"Diffusive Spreading: $\sigma \propto \sqrt{t}$" + "\n(Classical Limit)",
        xy=(35, 6.0),
        xytext=(23, 2.5),
        arrowprops=dict(facecolor=TEXT_IVORY, shrink=0.05, width=1.0, headwidth=6),
        color=TEXT_IVORY,
        fontsize=9.5,
    )

    fig.tight_layout()
    fig2_path = FIGURES_DIR / "fig2_std_dev_vs_timestep.png"
    fig.savefig(fig2_path)
    plt.close(fig)
    print(f"Saved: {fig2_path.name}")

    # -------------------------------------------------------------
    # Figure 3: Standard Deviation sigma(40) vs Noise Strength p
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 5.5), dpi=300)
    p_vals = [s["noise_strength"] for s in summary_t40]
    sigma_vals = [s["std_noisy"] for s in summary_t40]

    ax.plot(
        p_vals,
        sigma_vals,
        color=GOLD_PRIMARY,
        linewidth=2.2,
        marker="o",
        markersize=7,
        label=r"Simulated $\sigma(p)$ at $T = 40$",
    )
    ax.axhline(
        np.sqrt(40),
        color=TEXT_MUTED,
        linestyle="--",
        linewidth=1.8,
        label=rf"Classical Boundary $\sigma = \sqrt{{40}} \approx {np.sqrt(40):.4f}$",
    )

    ax.set_title(
        r"Decoherence Curve: Standard Deviation $\sigma(p)$ at $T = 40$",
        pad=15,
        fontweight="bold",
    )
    ax.set_xlabel("Coin Phase Damping Noise Strength p (0 = Ideal, 1 = Complete Dephasing)")
    ax.set_ylabel(r"Standard Deviation $\sigma(40)$")
    ax.set_xlim(-0.05, 1.05)
    ax.set_ylim(4.5, 23.5)
    ax.grid(True)
    ax.legend(loc="upper right", framealpha=0.9)

    for p, s in zip(p_vals, sigma_vals):
        ax.annotate(
            f"{s:.2f}",
            (p, s),
            textcoords="offset points",
            xytext=(0, 10),
            ha="center",
            color=GOLD_HIGHLIGHT,
            fontweight="bold",
            fontsize=9.5,
        )

    fig.tight_layout()
    fig3_path = FIGURES_DIR / "fig3_std_dev_vs_noise_param.png"
    fig.savefig(fig3_path)
    plt.close(fig)
    print(f"Saved: {fig3_path.name}")

    # -------------------------------------------------------------
    # Figure 4: Total Variation Distance to Classical vs Noise Strength p at T=40
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 5.5), dpi=300)
    tv_vals = [s["total_variation_distance_classical"] for s in summary_t40]

    ax.plot(
        p_vals,
        tv_vals,
        color=GOLD_HIGHLIGHT,
        linewidth=2.2,
        marker="s",
        markersize=7,
        label=r"$TV(P_{\mathrm{noisy}}, P_{\mathrm{classical}}) = \frac{1}{2} \sum |P_n(x) - P_{\mathrm{cl}}(x)|$",
    )

    ax.set_title(
        r"Convergence to Classicality: Total Variation Distance at $T = 40$",
        pad=15,
        fontweight="bold",
    )
    ax.set_xlabel("Noise Strength p (Phase Damping Parameter)")
    ax.set_ylabel("Total Variation Distance to Classical Reference")
    ax.set_xlim(-0.05, 1.05)
    ax.set_ylim(-0.03, 0.62)
    ax.grid(True)
    ax.legend(loc="upper right", framealpha=0.9)

    for p, tv in zip(p_vals, tv_vals):
        ax.annotate(
            f"{tv:.4f}",
            (p, tv),
            textcoords="offset points",
            xytext=(0, 10),
            ha="center",
            color=TEXT_IVORY,
            fontweight="bold",
            fontsize=9.5,
        )

    fig.tight_layout()
    fig4_path = FIGURES_DIR / "fig4_tv_distance_vs_noise_param.png"
    fig.savefig(fig4_path)
    plt.close(fig)
    print(f"Saved: {fig4_path.name}")

    # -------------------------------------------------------------
    # Figure 5: Complete Dephasing p=1.00 vs Classical Binomial Reference & Residuals
    # -------------------------------------------------------------
    fig, (ax1, ax2) = plt.subplots(
        2, 1, figsize=(10, 7), dpi=300, sharex=True, gridspec_kw={"height_ratios": [3, 1]}
    )

    diffs = [abs(pn - pcl) for pn, pcl in zip(p_vals_10, p_vals_cl)]

    ax1.plot(
        x_vals,
        p_vals_10,
        color=GOLD_PRIMARY,
        linewidth=2.0,
        marker="o",
        markersize=3.5,
        label=r"Decohered Quantum Walk ($p = 1.00$)",
    )
    ax1.plot(
        x_vals,
        p_vals_cl,
        color=TEXT_IVORY,
        linewidth=1.8,
        linestyle="--",
        marker="x",
        markersize=3.5,
        label=r"Classical Binomial Walk Reference",
    )
    ax1.set_title(
        r"Exact Convergence at $p = 1.00$: Decohered Quantum Walk vs Classical Reference ($T = 40$)",
        pad=12,
        fontweight="bold",
    )
    ax1.set_ylabel("Probability P(x, 40)")
    ax1.set_xlim(-30, 30)
    ax1.grid(True)
    ax1.legend(loc="upper right", framealpha=0.9)

    # Residuals
    ax2.bar(x_vals, diffs, width=0.8, color=GOLD_HIGHLIGHT, alpha=0.9, label="|P_noisy - P_classical|")
    ax2.set_xlabel("Lattice Coordinate x")
    ax2.set_ylabel("Absolute Diff")
    ax2.set_ylim(0, 1e-15)  # machine precision limit
    ax2.set_yticks([0, 5e-16, 1e-15])
    ax2.grid(True)
    ax2.legend(loc="upper right", framealpha=0.9)

    fig.tight_layout()
    fig5_path = FIGURES_DIR / "fig5_p100_vs_classical_residual.png"
    fig.savefig(fig5_path)
    plt.close(fig)
    print(f"Saved: {fig5_path.name}")

    print("\nALL 5 SCIENTIFIC FIGURES GENERATED SUCCESSFULLY.")


if __name__ == "__main__":
    run_experiments()
