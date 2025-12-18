// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
/**
 * Calculate check digit for eMAID according to eMI³ specification
 * Based on the algorithm described in "Check Digit Calculation for Contract-IDs"
 *
 * This implementation can detect five most frequent error types:
 * 1. Single error: one character is wrong
 * 2. Adjacent transposition: two adjacent characters are swapped
 * 3. Twin error: two identical adjacent characters are both changed
 * 4. Jump transposition: abc becomes cba
 * 5. Jump twin error: aca becomes bcb
 *
 * @param emaidWithoutCheckDigit - The first 14 characters of the eMAID (without check digit)
 * @returns The calculated check digit character
 */
export function calculateCheckDigit(emaidWithoutCheckDigit: string): string {
  // Ensure input is uppercase and 14 characters
  const input = emaidWithoutCheckDigit.toUpperCase();
  if (input.length !== 14) {
    throw new Error('Input must be exactly 14 characters');
  }

  // Validate that input contains only alphanumeric characters
  if (!/^[A-Z0-9]+$/.test(input)) {
    throw new Error('Input must contain only alphanumeric characters');
  }

  // Lookup tables for q1, q2, r1, r2 values based on the PDF specification
  const lookupTable: Record<string, { q1: number; q2: number; r1: number; r2: number }> = {
    '0': { q1: 0, q2: 0, r1: 0, r2: 0 },
    '1': { q1: 0, q2: 0, r1: 0, r2: 1 },
    '2': { q1: 0, q2: 0, r1: 0, r2: 2 },
    '3': { q1: 0, q2: 0, r1: 1, r2: 0 },
    '4': { q1: 0, q2: 0, r1: 1, r2: 1 },
    '5': { q1: 0, q2: 0, r1: 1, r2: 2 },
    '6': { q1: 0, q2: 0, r1: 2, r2: 0 },
    '7': { q1: 0, q2: 0, r1: 2, r2: 1 },
    '8': { q1: 0, q2: 0, r1: 2, r2: 2 },
    '9': { q1: 0, q2: 1, r1: 0, r2: 0 },
    A: { q1: 0, q2: 1, r1: 0, r2: 1 },
    B: { q1: 0, q2: 1, r1: 0, r2: 2 },
    C: { q1: 0, q2: 1, r1: 1, r2: 0 },
    D: { q1: 0, q2: 1, r1: 1, r2: 1 },
    E: { q1: 0, q2: 1, r1: 1, r2: 2 },
    F: { q1: 0, q2: 1, r1: 2, r2: 0 },
    G: { q1: 0, q2: 1, r1: 2, r2: 1 },
    H: { q1: 0, q2: 1, r1: 2, r2: 2 },
    I: { q1: 1, q2: 0, r1: 0, r2: 0 },
    J: { q1: 1, q2: 0, r1: 0, r2: 1 },
    K: { q1: 1, q2: 0, r1: 0, r2: 2 },
    L: { q1: 1, q2: 0, r1: 1, r2: 0 },
    M: { q1: 1, q2: 0, r1: 1, r2: 1 },
    N: { q1: 1, q2: 0, r1: 1, r2: 2 },
    O: { q1: 1, q2: 0, r1: 2, r2: 0 },
    P: { q1: 1, q2: 0, r1: 2, r2: 1 },
    Q: { q1: 1, q2: 0, r1: 2, r2: 2 },
    R: { q1: 1, q2: 1, r1: 0, r2: 0 },
    S: { q1: 1, q2: 1, r1: 0, r2: 1 },
    T: { q1: 1, q2: 1, r1: 0, r2: 2 },
    U: { q1: 1, q2: 1, r1: 1, r2: 0 },
    V: { q1: 1, q2: 1, r1: 1, r2: 1 },
    W: { q1: 1, q2: 1, r1: 1, r2: 2 },
    X: { q1: 1, q2: 1, r1: 2, r2: 0 },
    Y: { q1: 1, q2: 1, r1: 2, r2: 1 },
    Z: { q1: 1, q2: 1, r1: 2, r2: 2 },
  };

  // Matrix P1 powers over Z2 (modulo 2)
  // The pattern repeats every 3 positions
  const getP1Power = (index: number): number[][] => {
    const position = (index % 3) + 1;
    if (position === 3) {
      return [
        [1, 0],
        [0, 1],
      ]; // Identity matrix for positions 3, 6, 9, 12, 15
    } else if (position === 1) {
      return [
        [0, 1],
        [1, 1],
      ]; // P1 for positions 1, 4, 7, 10, 13
    } else {
      return [
        [1, 1],
        [1, 0],
      ]; // P1^2 for positions 2, 5, 8, 11, 14
    }
  };

  // Matrix P2 powers over Z3 (modulo 3)
  // The pattern repeats every 8 positions
  const P2_powers: number[][][] = [
    [
      [0, 1],
      [1, 2],
    ], // P2^1
    [
      [1, 2],
      [2, 2],
    ], // P2^2
    [
      [2, 2],
      [2, 0],
    ], // P2^3
    [
      [2, 0],
      [0, 2],
    ], // P2^4
    [
      [0, 2],
      [2, 1],
    ], // P2^5
    [
      [2, 1],
      [1, 1],
    ], // P2^6
    [
      [1, 1],
      [1, 0],
    ], // P2^7
    [
      [1, 0],
      [0, 1],
    ], // P2^8 (Identity)
  ];

  const getP2Power = (index: number): number[][] => {
    return P2_powers[index % 8];
  };

  // Initialize accumulators for check equations
  const q_sum = [0, 0]; // For Z2 calculation
  const r_sum = [0, 0]; // For Z3 calculation

  // Process each character
  for (let i = 0; i < 14; i++) {
    const char = input[i];
    const values = lookupTable[char];

    if (!values) {
      throw new Error(`Invalid character '${char}' at position ${i}`);
    }

    // Matrix multiplication for q (Z2)
    const P1 = getP1Power(i);
    const q_vec = [values.q1, values.q2];
    const q_result = [
      (P1[0][0] * q_vec[0] + P1[0][1] * q_vec[1]) % 2,
      (P1[1][0] * q_vec[0] + P1[1][1] * q_vec[1]) % 2,
    ];
    q_sum[0] = (q_sum[0] + q_result[0]) % 2;
    q_sum[1] = (q_sum[1] + q_result[1]) % 2;

    // Matrix multiplication for r (Z3)
    const P2 = getP2Power(i);
    const r_vec = [values.r1, values.r2];
    const r_result = [
      (P2[0][0] * r_vec[0] + P2[0][1] * r_vec[1]) % 3,
      (P2[1][0] * r_vec[0] + P2[1][1] * r_vec[1]) % 3,
    ];
    r_sum[0] = (r_sum[0] + r_result[0]) % 3;
    r_sum[1] = (r_sum[1] + r_result[1]) % 3;
  }

  // Calculate check digit values
  // For position 15: P1^15 = Identity, P2^15 = [[1,1],[1,0]]

  // Solve for q15 such that the check equation equals 0
  // Since P1^15 is identity, q15 = -q_sum (mod 2)
  const q15 = [(2 - q_sum[0]) % 2, (2 - q_sum[1]) % 2];

  // Solve for r15 such that the check equation equals 0
  // For P2^15 = [[1,1],[1,0]], we solve: [r15_1, r15_2] * P2^15 = -r_sum
  // This gives: r15_1 = -r_sum[1] and r15_1 + r15_2 = -r_sum[0]
  const r15 = [(3 - r_sum[1]) % 3, (((3 - r_sum[0]) % 3) + r_sum[1]) % 3];

  // Convert from two-dimensional to single values
  const q_value = q15[0] * 2 + q15[1]; // Convert from Z2 × Z2 to {0,1,2,3}
  const r_value = r15[0] * 3 + r15[1]; // Convert from Z3 × Z3 to {0,1,2,...,8}

  // Combine using the formula: a = q * 9 + r
  const checkValue = q_value * 9 + r_value;

  // Map the check value (0-35) directly to alphanumeric characters
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (checkValue < 0 || checkValue >= 36) {
    throw new Error(`Invalid check value: ${checkValue}`);
  }

  return charset[checkValue];
}
