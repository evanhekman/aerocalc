from equation import Equation
import sympy as sp

class Graph:
    def __init__(self, parameters: list[sp.Basic], equations: list[Equation]):
        self.params = parameters
        self.equations = equations
    
    def solve(self, known: set[sp.Basic], missing: sp.Basic, equations: list[Equation]):
        """
        - this function does BFS on the available equations and returns the list of equations
        required to solve for the missing parameter given the known parameters.
        - returns empty list if impossible

        - missing parameter
        - set of known parameters
        - set of solved equations
        - list of all equations
        - dictionary mapping each parameter to the equation used to solve it
        """
        solved = set()
        for eq in self.equations:
            if eq.solvable(known):
                # mark equation as solved
                solved.add(eq)
                # mark parameters as available for new solves
                for param in eq.params:
                    if param not in known:
                        known.add(param)
        # continue with unsolved equations
        remaining_equations = [eq for eq in self.equations if eq not in solved]
        if len(remaining_equations) == len(equations):
            # this means no more equations can be solved
            return False
        if missing in known:
            return True
        self.solve(known, missing, remaining_equations)