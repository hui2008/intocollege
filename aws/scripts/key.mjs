import { EC2Client, CreateKeyPairCommand } from "@aws-sdk/client-ec2";
import * as fs from "fs";

async function createKeyPair() {
    const keyName = process.argv[2] || "IntoKeyPair-01";
    if (!keyName) {
        console.error("Please provide a key name as a command-line argument.");
        process.exit(1);
    }

    console.log(process.env.AWS_DEFAULT_REGION);
    const keyPath = new URL(`../${keyName}.pem`, import.meta.url);
    const client = new EC2Client({ region: process.env.AWS_DEFAULT_REGION });
    const command = new CreateKeyPairCommand({ KeyName: keyName });

    try {
        const response = await client.send(command);
        const privateKey = response.KeyMaterial;
        console.log(privateKey);

        fs.writeFileSync(keyPath, privateKey);
        fs.chmodSync(keyPath, 0o400); // Set file permissions to read-only

        console.log(`Key pair created and saved to ${keyPath}`);
    } catch (error) {
        console.error("Error creating key pair:", error);
    }
}

createKeyPair();
