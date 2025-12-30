// Unit conversion utilities

// Conversion factors to standard units
const CONVERSIONS = {
    P: {
        'Pa': 1,
        'kPa': 1000,
        'atm': 101325,
        'bar': 100000,
        'mmHg': 133.322,
        'psi': 6894.76
    },
    V: {
        'm³': 1,
        'L': 0.001,
        'mL': 0.000001,
        'cm³': 0.000001
    },
    n: {
        'mol': 1,
        'mmol': 0.001,
        'kmol': 1000
    },
    T: {
        'K': { type: 'kelvin' },
        '°C': { type: 'celsius' },
        '°F': { type: 'fahrenheit' }
    },
    R: {
        'J/(mol·K)': 8.314,
        'L·atm/(mol·K)': 0.08206,
        'cal/(mol·K)': 1.987
    },
    U: {
        'J': 1,
        'kJ': 1000,
        'cal': 4.184,
        'kcal': 4184
    },
    f: {
        '3': 3,
        '5': 5,
        '6': 6,
        '7': 7
    }
};

// Convert from user unit to standard unit
function toStandardUnit(value, node, unit) {
    if (!CONVERSIONS[node]) return value;

    const conversion = CONVERSIONS[node][unit];

    // Temperature conversion (to Kelvin)
    if (typeof conversion === 'object' && 'type' in conversion) {
        if (conversion.type === 'kelvin') return value;
        if (conversion.type === 'celsius') return value + 273.15;
        if (conversion.type === 'fahrenheit') return (value - 32) * 5/9 + 273.15;
    } else if (typeof conversion === 'number') {
        // Simple multiplication
        return value * conversion;
    }

    return value;
}

// Convert from standard unit to user unit
function fromStandardUnit(value, node, unit) {
    if (!CONVERSIONS[node]) return value;

    const conversion = CONVERSIONS[node][unit];

    // Temperature conversion (from Kelvin)
    if (typeof conversion === 'object' && 'type' in conversion) {
        if (conversion.type === 'kelvin') return value;
        if (conversion.type === 'celsius') return value - 273.15;
        if (conversion.type === 'fahrenheit') return (value - 273.15) * 9/5 + 32;
    } else if (typeof conversion === 'number') {
        // Simple division
        return value / conversion;
    }

    return value;
}

// Calculate R (gas constant) based on selected unit
// Returns the appropriate constant value for the selected unit system
function calculateR(selectedUnit) {
    const rValues = {
        'J/(mol·K)': 8.314,
        'L·atm/(mol·K)': 0.08206,
        'cal/(mol·K)': 1.987
    };

    return rValues[selectedUnit] || 8.314;
}

// Get R in standard units (always J/(mol·K))
function getStandardR() {
    return 8.314;
}
