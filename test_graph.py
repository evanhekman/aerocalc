from graph import Graph
from equation import Equation
import sympy as sp

"""
solving from (A, S, D) to L

-> ASF (F) -> DFH (H) -> HSK (K) -> DHJ (J) -> JKL (L)
-> ASF (F) -> FG (G) -> AGL (L)

ASF  # AS -> F
DFH  # DF -> H
HSK  # HS -> K
DHJ  # DH -> J
JKL  # JK -> L
FG   # F -> G
AGL  # AG -> L

"""

A, S, D, F, G, H, J, K, L = sp.symbols('A S D F G H J K L')
ONE = sp.Symbol('ONE')
params = [A, S, D, F, G, H, J, J, K, L]
eq1 = Equation(A * S, F)
eq2 = Equation(D * F * H, ONE)
eq3 = Equation(H - S, K)
eq4 = Equation(D, H + J)
eq5 = Equation(J - K - L, ONE)
eq6 = Equation(F, G + ONE)
eq7 = Equation(A, G * L)
equations = [eq1, eq2, eq3, eq4, eq5, eq6, eq7]
for eq in equations:
    print(eq.params)

graph = Graph(params, equations)
print(graph.solve_route(set([A, S, D, ONE]), L, equations))