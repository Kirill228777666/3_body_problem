
// physics_wasm.cpp
// Минимальное WASM-ядро для симуляции N тел с гравитацией Ньютона.
// Экспортирует два метода:
//  - integrate               : один шаг RK4
//  - integrate_extrapolated  : тяжёлый RK4 с экстраполяцией Ричардсона

#include <stdint.h>
#include <stddef.h>

extern "C" {
extern unsigned char __heap_base;
static uintptr_t heap_ptr = (uintptr_t)&__heap_base;

void* memcpy(void* dest, const void* src, size_t n) {
  unsigned char* d = (unsigned char*)dest;
  const unsigned char* s = (const unsigned char*)src;
  for (size_t i = 0; i < n; ++i) d[i] = s[i];
  return dest;
}

uintptr_t malloc(size_t size) {
  heap_ptr = (heap_ptr + 7) & ~((uintptr_t)7);
  uintptr_t ptr = heap_ptr;
  heap_ptr += size;
  return ptr;
}

void free(void* ptr) { (void)ptr; }
}

static const int MAX_BODIES = 16;
static const int MAX_DIM = MAX_BODIES * 4;
static double K1[MAX_DIM], K2[MAX_DIM], K3[MAX_DIM], K4[MAX_DIM], YT[MAX_DIM], Y0[MAX_DIM];
static double TABLEAU[6][MAX_DIM];
static double EXTRAP[6][MAX_DIM];

static void computeDerivative(const double* state, double* deriv,
                              int bodies, const double* masses,
                              int dimensionless, double softeningSq) {
  const double G = dimensionless ? 1.0 : 6.67408e-11;

  for (int i = 0; i < bodies; ++i) {
    const int idx = i * 4;
    deriv[idx] = state[idx + 2];
    deriv[idx + 1] = state[idx + 3];
    double ax = 0.0;
    double ay = 0.0;

    for (int j = 0; j < bodies; ++j) {
      if (i == j) continue;
      const int jdx = j * 4;
      const double dx = state[jdx] - state[idx];
      const double dy = state[jdx + 1] - state[idx + 1];
      const double r2 = dx * dx + dy * dy + softeningSq;
      if (r2 == 0.0) continue;
      const double r3 = r2 * __builtin_sqrt(r2);
      if (r3 == 0.0) continue;
      const double factor = G * masses[j] / r3;
      ax += factor * dx;
      ay += factor * dy;
    }

    deriv[idx + 2] = ax;
    deriv[idx + 3] = ay;
  }
}

static void rk4_step(double timestep, const double* state, double* out,
                     int bodies, const double* masses,
                     int dimensionless, double softeningSq) {
  const int dim = bodies * 4;
  for (int i = 0; i < dim; ++i) Y0[i] = state[i];

  computeDerivative(Y0, K1, bodies, masses, dimensionless, softeningSq);
  for (int i = 0; i < dim; ++i) YT[i] = Y0[i] + 0.5 * timestep * K1[i];

  computeDerivative(YT, K2, bodies, masses, dimensionless, softeningSq);
  for (int i = 0; i < dim; ++i) YT[i] = Y0[i] + 0.5 * timestep * K2[i];

  computeDerivative(YT, K3, bodies, masses, dimensionless, softeningSq);
  for (int i = 0; i < dim; ++i) YT[i] = Y0[i] + timestep * K3[i];

  computeDerivative(YT, K4, bodies, masses, dimensionless, softeningSq);
  for (int i = 0; i < dim; ++i) {
    out[i] = Y0[i] + (timestep / 6.0) * (K1[i] + 2.0 * K2[i] + 2.0 * K3[i] + K4[i]);
  }
}

static void rk4_substeps(double timestep, const double* state, double* out,
                         int bodies, const double* masses,
                         int dimensionless, double softeningSq, int substeps) {
  const int dim = bodies * 4;
  const double dt = timestep / (double)substeps;
  for (int i = 0; i < dim; ++i) out[i] = state[i];

  for (int s = 0; s < substeps; ++s) {
    rk4_step(dt, out, YT, bodies, masses, dimensionless, softeningSq);
    for (int i = 0; i < dim; ++i) out[i] = YT[i];
  }
}

extern "C" {

void integrate(double timestep, double* state, int bodies,
               const double* masses, int dimensionless,
               double softeningParamSquared) {
  if (bodies <= 0 || bodies > MAX_BODIES) return;
  const int dim = bodies * 4;
  rk4_step(timestep, state, YT, bodies, masses, dimensionless, softeningParamSquared);
  for (int i = 0; i < dim; ++i) state[i] = YT[i];
}

void integrate_extrapolated(double timestep, double* state, int bodies,
                            const double* masses, int dimensionless,
                            double softeningParamSquared) {
  if (bodies <= 0 || bodies > MAX_BODIES) return;
  const int dim = bodies * 4;
  const int levels = 6;
  int n = 1;

  for (int k = 0; k < levels; ++k) {
    rk4_substeps(timestep, state, TABLEAU[k], bodies, masses, dimensionless, softeningParamSquared, n);
    n *= 2;
  }

  // Ромберг-подобная экстраполяция Ричардсона для базового метода порядка 4.
  for (int k = 1; k < levels; ++k) {
    for (int j = 1; j <= k; ++j) {
      double factor = 1.0;
      for (int p = 0; p < 4 * j; ++p) factor *= 2.0;
      const double denom = factor - 1.0;
      for (int i = 0; i < dim; ++i) {
        EXTRAP[j][i] = TABLEAU[k][i] + (TABLEAU[k][i] - TABLEAU[k - 1][i]) / denom;
      }
      for (int i = 0; i < dim; ++i) TABLEAU[k - 1][i] = TABLEAU[k][i];
      for (int i = 0; i < dim; ++i) TABLEAU[k][i] = EXTRAP[j][i];
    }
  }

  for (int i = 0; i < dim; ++i) state[i] = TABLEAU[levels - 1][i];
}

}
