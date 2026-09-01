import { NextResponse } from "next/server";
import { signAndSubmit } from "../../../../lib/chain/signer";
import { parseEther } from "ethers";

export async function GET() {
  try {
    
    const failPayload = {
      to: "0x0000000000000000000000000000000000000000",
      value: parseEther("9999"), 
      data: "0x"
    };

    
    const successPayload = {
      to: "0x0301a6a0e5Ce452a29681fE90dA4cA1933f5482f", 
      value: parseEther("0"),
      data: "0x"
    };
   
    const result = await signAndSubmit(failPayload); 

   

    return NextResponse.json({
      message: "test completed",
      result: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "if you see this message,means something wrong with signer", details: String(error) },
      { status: 500 }
    );
  }
}