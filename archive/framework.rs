#[derive(Copy, Clone, Debug)]
struct Property {
    Name: String,
    Value: f64,
    Unit: String,
}

#[derive(Debug)]
struct Conversion {
    Properties: Vec<Property>,
    Equation: fn (Vec<Property>) -> Property,
    Conditions: Vec<Condition>,
}

fn main() {
    // PV = RT
    let property_R = Property {
        Name: String::from("R"),
        Value: 287.05,
        Unit: String::from(""),
    };
    let property_P = Property {
        Name: String::from("P"),
        Value: 101325.0,
        Unit: String::from("Pa"),
    };
    let property_T = Property {
        Name: String::from("T"),
        Value: 288.15,
        Unit: String::from("K"),
    };
    let property_V = Property {
        Name: String::from("V"),
        Value: 1.0,
        Unit: String::from("m^3/kg"),
    };

    let conversion_PV_RT = Conversion {
        Properties: vec![property_P, property_V, property_R, property_T],
        Equation: {
            |inputs: Vec<Property>| -> Property {
                let mut P: Option<Property> = None;
                let mut V: Option<Property> = None;
                let mut R: Option<Property> = None;
                let mut T: Option<Property> = None;
                for property in inputs {
                    match property.Name.as_str() {
                        "P" => P = Some(property),
                        "V" => V = Some(property),
                        "R" => R = Some(property),
                        "T" => T = Some(property),
                        _ => {}
                    }
                }
                match (P, V, R, T) {
                    (Some(P), Some(V), Some(R), None) => {
                        // T = PV/R
                        return Property {
                            Name: String::from("T"),
                            Value: P.Value * V.Value / R.Value,
                            Unit: String::from("K")
                        }
                    }
                    (Some(P), Some(V), None, Some(T)) => {
                        // R = PV/T
                        return Property {
                            Name: String::from("R"),
                            Value: P.Value * V.Value / T.Value,
                            Unit: String::from("")
                        }
                    }
                    (Some(P), None, Some(R), Some(T)) => {
                        // V = RT/P
                        return Property {
                            Name: String::from("V"),
                            Value: R.Value * T.Value / P.Value,
                            Unit: String::from("m^3/kg")
                        }
                    }
                    (None, Some(V), Some(R), Some(T)) => {
                        // P = RT/V
                        return Property {
                            Name: String::from("P"),
                            Value: R.Value * T.Value / V.Value,
                            Unit: String::from("Pa")
                        }
                    }
                    _ => {
                        panic!("Incorrect combination of parameters provided");
                    }
                }
            }
        },
        Conditions: vec![],
    };

    // double pressure, compute volume to be half
    let property_P2 = Property {
        Name: String::from("P"),
        Value: 202650.0,
        Unit: String::from("Pa")
    };
    let property_V2 = (conversion_PV_RT.Equation)(vec![property_P2, property_R, property_T]);
    println!("New Volume: {:?}", property_V2);
}