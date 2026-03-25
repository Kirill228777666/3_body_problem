// physics_wasm.cpp
// Ядро физики для симуляции N тел (по умолчанию 3) с гравитацией Ньютона.
// Интегрирование: Рунге–Кутта 4-го порядка (RK4).
// Компилируется emscripten'ом в WebAssembly и вызывается из JS.

#include <cmath>
#include <vector>
#include <emscripten/emscripten.h>

// Вычисление производной состояния (скоростей и ускорений).
// state: [x0,y0,vx0,vy0, x1,y1,vx1,vy1, ...]
// deriv: такого же размера, на выходе: [vx0,vy0,ax0,ay0, ...]

static void computeDerivative(const double* state, double* deriv,
                              int bodies, const double* masses,
                              bool dimensionless, double softeningSq) {
    const double G = dimensionless ? 1.0 : 6.67408e-11;

    for (int i = 0; i < bodies; ++i) {
        const int idx = i * 4;
        // d(x,y)/dt = (vx, vy)
        deriv[idx]     = state[idx + 2];
        deriv[idx + 1] = state[idx + 3];
        double ax = 0.0;
        double ay = 0.0;
        // сумма ускорений от всех остальных тел
        for (int j = 0; j < bodies; ++j) {
            if (i == j) continue;
            const int jdx = j * 4;
            const double dx = state[jdx]     - state[idx];
            const double dy = state[jdx + 1] - state[idx + 1];
            const double r2 = dx * dx + dy * dy + softeningSq;
            if (r2 == 0.0)
                continue;
            // r^3 = (r^2) * sqrt(r^2)
            const double r3 = r2 * std::sqrt(r2);
            if (r3 == 0.0)
                continue;
            const double factor = G * masses[j] / r3;
            ax += factor * dx;
            ay += factor * dy;
        }

        deriv[idx + 2] = ax;
        deriv[idx + 3] = ay;
    }
}

extern "C" {

// Интегрирование одного шага по времени методом RK4.
// timestep — шаг времени; state — массив состояния длиной bodies*4;
// masses — массив масс длиной bodies; dimensionless — 0 или 1;
// softeningParamSquared — ε^2.
EMSCRIPTEN_KEEPALIVE
void integrate(double timestep, double* state, int bodies,
               const double* masses, int dimensionless,
               double softeningParamSquared) {
    const int dim = bodies * 4;
    std::vector<double> y0(dim);
    std::vector<double> y_temp(dim);
    std::vector<double> k1(dim), k2(dim), k3(dim), k4(dim);

        for (int i = 0; i < dim; ++i) y0[i] = state[i];

    const bool dimless = (dimensionless != 0);

    computeDerivative(y0.data(), k1.data(), bodies, masses, dimless, softeningParamSquared);

    for (int i = 0; i < dim; ++i) y_temp[i] = y0[i] + 0.5 * timestep * k1[i];
    computeDerivative(y_temp.data(), k2.data(), bodies, masses, dimless, softeningParamSquared);

    for (int i = 0; i < dim; ++i) y_temp[i] = y0[i] + 0.5 * timestep * k2[i];
    computeDerivative(y_temp.data(), k3.data(), bodies, masses, dimless, softeningParamSquared);

    for (int i = 0; i < dim; ++i) y_temp[i] = y0[i] + timestep * k3[i];
    computeDerivative(y_temp.data(), k4.data(), bodies, masses, dimless, softeningParamSquared);

    for (int i = 0; i < dim; ++i) {
        state[i] = y0[i] + (timestep / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
    }
}

} // extern "C"
