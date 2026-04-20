import axios from 'axios';

/**
 * Frontend utility to interact with our backend PayOS endpoints
 */
export async function createTopupOrder(userId: string, amount: number, description?: string) {
  try {
    const response = await axios.post('/api/create-topup-order', {
      userId,
      amount,
      description
    });
    return response.data;
  } catch (error: any) {
    console.error("Create Order Error:", error);
    throw error.response?.data?.error || "Failed to create payment link";
  }
}
