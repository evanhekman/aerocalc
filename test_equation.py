import equation
import sympy as sp

p, v = sp.symbols('P V')
r, t = sp.symbols('R T')
pvrt = equation.Equation(p * v, r * t)

while True:
    try:
        print("enter values for p, v, r, t")
        p = input("P: ")
        v = input("V: ")
        r = input("R: ")
        t = input("T: ")
        p = float(p) if p else None
        v = float(v) if v else None
        r = float(r) if r else None
        t = float(t) if t else None
    
        print(p, v, r, t)

        result = pvrt.solve({'P': p, 'V': v, 'R': r, 'T': t})
        print(f"result: {result}")
    except KeyboardInterrupt:
        exit(0)
    except Exception as e:
        print("unable to solve, try again")
        print(e)
