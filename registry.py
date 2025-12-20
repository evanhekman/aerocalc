import sympy as sp
from equation import Equation

A, B, C, D, E, F, G = sp.Symbols(
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
)

equation1 = Equation(A * B, C * D)
equation2 = Equation(D + E, F + G)
equation3 = Equation(A * E, C * C)

