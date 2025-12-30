import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const execAsync = promisify(exec);

/**
 * Represents a printer with its details
 */
export interface Printer {
  name: string;
  uri: string;
  status: string;
  isDefault: boolean;
  isUSB: boolean;
  description?: string;
}

/**
 * Options for printing an image
 */
export interface PrintOptions {
  /** Number of copies to print */
  copies?: number;
  /** Media/paper size (e.g., 'Letter', 'A4', '4x6') */
  media?: string;
  /** Print in grayscale */
  grayscale?: boolean;
  /** Fit image to page */
  fitToPage?: boolean;
  /** Additional CUPS options as key-value pairs */
  cupOptions?: Record<string, string>;
}

/**
 * Get a list of all available printers on macOS
 * @returns Array of printer objects
 */
export async function getAllPrinters(): Promise<Printer[]> {
  try {
    // Get printer names and status
    const { stdout: printerList } = await execAsync("lpstat -p -d");

    // Get printer URIs/devices
    const { stdout: printerDevices } = await execAsync("lpstat -v");

    const printers: Printer[] = [];
    const lines = printerList.split("\n");
    const deviceLines = printerDevices.split("\n");

    // Parse default printer
    let defaultPrinter = "";
    const defaultMatch = printerList.match(/system default destination: (.+)/);
    if (defaultMatch) {
      defaultPrinter = defaultMatch[1];
    }

    // Parse each printer
    for (const line of lines) {
      const match = line.match(/printer (.+?) (.*)/);
      if (match) {
        const printerName = match[1];
        const status = match[2] || "unknown";

        // Find the device URI for this printer
        const deviceLine = deviceLines.find((d) => d.includes(printerName));
        let uri = "";
        let isUSB = false;

        if (deviceLine) {
          const uriMatch = deviceLine.match(/device for (.+?): (.+)/);
          if (uriMatch) {
            uri = uriMatch[2];
            // Check if it's a USB printer
            isUSB = uri.toLowerCase().includes("usb");
          }
        }

        printers.push({
          name: printerName,
          uri,
          status,
          isDefault: printerName === defaultPrinter,
          isUSB,
          description: status,
        });
      }
    }

    return printers;
  } catch (error) {
    throw new Error(
      `Failed to get printers: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get all USB-connected printers
 * @returns Array of USB printer objects
 */
export async function getUSBPrinters(): Promise<Printer[]> {
  const allPrinters = await getAllPrinters();
  return allPrinters.filter((p) => p.isUSB);
}

/**
 * Check if a printer is accepting jobs (not paused/disabled)
 * @param printerName Name of the printer
 * @returns True if printer is enabled and accepting jobs
 */
export async function isPrinterEnabled(printerName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lpstat -p "${printerName}"`);

    // Check for disabled/paused states
    const isDisabled =
      stdout.toLowerCase().includes("disabled") ||
      stdout.toLowerCase().includes("paused");

    return !isDisabled;
  } catch (error) {
    throw new Error(
      `Failed to check printer status: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Enable/resume a printer that is paused or disabled
 * @param printerName Name of the printer to enable
 * @returns Success message
 */
export async function enablePrinter(printerName: string): Promise<string> {
  try {
    // Enable/resume the printer using cupsenable
    await execAsync(`cupsenable "${printerName}"`);

    // Also accept jobs (in case it was rejecting)
    await execAsync(`cupsaccept "${printerName}"`);

    return `Printer "${printerName}" has been enabled and is now accepting jobs`;
  } catch (error) {
    throw new Error(
      `Failed to enable printer: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Check printer status and optionally enable it if paused
 * @param printerName Name of the printer
 * @param autoEnable Whether to automatically enable if paused (default: true)
 * @returns Object with status info
 */
export async function checkAndResumePrinter(
  printerName: string,
  autoEnable: boolean = true
): Promise<{ wasEnabled: boolean; message: string }> {
  const isEnabled = await isPrinterEnabled(printerName);

  if (isEnabled) {
    return {
      wasEnabled: true,
      message: `Printer "${printerName}" is ready`,
    };
  }

  if (autoEnable) {
    const message = await enablePrinter(printerName);
    return {
      wasEnabled: false,
      message: `${message} (was paused/disabled)`,
    };
  }

  return {
    wasEnabled: false,
    message: `Printer "${printerName}" is paused/disabled`,
  };
}

/**
 * Get detailed information about a specific printer
 * @param printerName Name of the printer
 * @returns Printer details including supported options
 */
export async function getPrinterInfo(printerName: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`lpoptions -p "${printerName}" -l`);
    return stdout;
  } catch (error) {
    throw new Error(
      `Failed to get printer info: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Check if a file exists and is readable
 * @param filePath Path to the file
 */
async function validateImageFile(filePath: string): Promise<void> {
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    const ext = path.extname(filePath).toLowerCase();
    const supportedFormats = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".pdf",
      ".tiff",
      ".tif",
    ];

    if (!supportedFormats.includes(ext)) {
      throw new Error(
        `Unsupported file format: ${ext}. Supported formats: ${supportedFormats.join(
          ", "
        )}`
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Build the print command with options
 */
function buildPrintCommand(
  printerName: string,
  imagePath: string,
  options: PrintOptions = {}
): string {
  const args: string[] = ["lp"];

  // Add printer name
  args.push("-d", `"${printerName}"`);

  // Add copies
  if (options.copies && options.copies > 1) {
    args.push("-n", options.copies.toString());
  }

  // Add media size
  if (options.media) {
    args.push("-o", `media=${options.media}`);
  }

  // Add grayscale option
  if (options.grayscale) {
    args.push("-o", "ColorModel=Gray");
  }

  // Fit to page
  if (options.fitToPage) {
    args.push("-o", "fit-to-page");
  }

  // Add custom CUPS options
  if (options.cupOptions) {
    for (const [key, value] of Object.entries(options.cupOptions)) {
      args.push("-o", `${key}=${value}`);
    }
  }

  // Add the file path
  args.push(`"${imagePath}"`);

  return args.join(" ");
}

/**
 * Print an image to a specific printer
 * @param printerName Name of the printer to use
 * @param imagePathOrBuffer Path to the image file or a Buffer containing the image data
 * @param options Optional print settings
 * @returns Job ID of the print job
 */
export async function printImage(
  printerName: string,
  imagePathOrBuffer: string | Buffer,
  options: PrintOptions = {}
): Promise<string> {
  let tempFilePath: string | null = null;
  let imagePath: string;

  try {
    // Handle Buffer input by creating a temporary file
    if (Buffer.isBuffer(imagePathOrBuffer)) {
      // Create a temporary file
      const tempDir = os.tmpdir();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      tempFilePath = path.join(
        tempDir,
        `print-temp-${timestamp}-${randomId}.png`
      );

      // Write buffer to temp file
      await fs.promises.writeFile(tempFilePath, imagePathOrBuffer);
      imagePath = tempFilePath;
    } else {
      // Validate the image file path
      await validateImageFile(imagePathOrBuffer);
      imagePath = imagePathOrBuffer;
    }

    // Check if printer exists
    const printers = await getAllPrinters();
    const printer = printers.find((p) => p.name === printerName);

    if (!printer) {
      throw new Error(`Printer not found: ${printerName}`);
    }

    const command = buildPrintCommand(printerName, imagePath, options);
    const { stdout } = await execAsync(command);

    // Extract job ID from output
    // Output format: "request id is PrinterName-JobID (1 file(s))"
    const jobMatch = stdout.match(/request id is .+-(\d+)/);
    const jobId = jobMatch ? jobMatch[1] : stdout.trim();

    return jobId;
  } catch (error) {
    throw new Error(
      `Failed to print: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  } finally {
    // Clean up temporary file if one was created
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (error) {
        // Ignore cleanup errors
        console.warn(
          `Warning: Could not delete temporary file: ${tempFilePath}`
        );
      }
    }
  }
}

/**
 * Print an image to the first available USB printer
 * @param imagePathOrBuffer Path to the image file or a Buffer containing the image data
 * @param options Optional print settings
 * @returns Object containing printer name and job ID
 */
export async function printToUSB(
  imagePathOrBuffer: string | Buffer,
  options: PrintOptions = {}
): Promise<{ printerName: string; jobId: string }> {
  // Check if running in WSL
  const isWSL = os.release().toLowerCase().includes("microsoft");

  if (isWSL) {
    return printToWindowsFromWSL(imagePathOrBuffer);
  }

  const usbPrinters = await getUSBPrinters();

  if (usbPrinters.length === 0) {
    throw new Error("No USB printers found");
  }

  // Use the first USB printer or the default one if it's USB
  const printer = usbPrinters.find((p) => p.isDefault) || usbPrinters[0];

  const jobId = await printImage(printer.name, imagePathOrBuffer, options);

  return {
    printerName: printer.name,
    jobId,
  };
}

/**
 * Print from WSL using Windows printer
 */
async function printToWindowsFromWSL(
  imagePathOrBuffer: string | Buffer
): Promise<{ printerName: string; jobId: string }> {
  let imagePath: string;
  let tempFilePath: string | null = null;
  const printerName = "PM-241-BT";

  console.log("[WSL Print] Starting print job...");
  console.log("[WSL Print] os.release():", os.release());

  // Save to Windows-accessible temp location
  if (Buffer.isBuffer(imagePathOrBuffer)) {
    const timestamp = Date.now();
    tempFilePath = `/mnt/c/temp/sticker-${timestamp}.png`;
    await fs.promises.mkdir("/mnt/c/temp", { recursive: true });
    await fs.promises.writeFile(tempFilePath, imagePathOrBuffer);
    imagePath = tempFilePath;
    console.log("[WSL Print] Saved buffer to:", tempFilePath);
  } else {
    imagePath = imagePathOrBuffer;
    console.log("[WSL Print] Using existing file:", imagePath);
  }

  // Convert WSL path to Windows path
  const winPath = imagePath.replace(/^\/mnt\/([a-z])/, "$1:").replace(/\//g, "\\");
  console.log("[WSL Print] Windows path:", winPath);

  // Print using PowerShell to specific printer via rundll32
  const cmd = `/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -Command "rundll32 C:\\\\Windows\\\\System32\\\\shimgvw.dll,ImageView_PrintTo '${winPath}' '${printerName}'"`;
  console.log("[WSL Print] Executing:", cmd);
  
  const { stdout, stderr } = await execAsync(cmd);
  console.log("[WSL Print] stdout:", stdout);
  console.log("[WSL Print] stderr:", stderr);

  // Cleanup after a delay (give Windows time to spool)
  if (tempFilePath) {
    console.log("[WSL Print] File saved at:", tempFilePath, "(will delete in 10s)");
    setTimeout(async () => {
      try {
        await fs.promises.unlink(tempFilePath!);
      } catch {}
    }, 10000);
  }

  return { printerName, jobId: "wsl-print" };
}

/**
 * Get the status of a print job
 * @param jobId Optional job ID. If not provided, shows all jobs
 * @returns Print queue status
 */
export async function getPrintJobStatus(jobId?: string): Promise<string> {
  try {
    const command = jobId ? `lpq ${jobId}` : "lpq";
    const { stdout } = await execAsync(command);
    return stdout;
  } catch (error) {
    throw new Error(
      `Failed to get job status: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Cancel a print job
 * @param jobId Job ID to cancel, or printer name to cancel all jobs
 */
export async function cancelPrintJob(jobId: string): Promise<void> {
  try {
    await execAsync(`cancel ${jobId}`);
  } catch (error) {
    throw new Error(
      `Failed to cancel job: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * List all available media sizes for a printer
 * @param printerName Name of the printer
 * @returns Array of supported media sizes
 */
export async function getAvailableMediaSizes(
  printerName: string
): Promise<string[]> {
  try {
    const info = await getPrinterInfo(printerName);
    const mediaMatch = info.match(/PageSize\/Media Size: (.+)/);

    if (mediaMatch) {
      const sizes = mediaMatch[1].split(" ");
      return sizes.filter((s) => s && s !== "*");
    }

    return [];
  } catch (error) {
    throw new Error(
      `Failed to get media sizes: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Watch for paused printers and automatically resume them
 * Runs in a loop checking every second
 * @param options Options for the watcher
 * @returns Stop function to stop the watcher
 */
export function watchAndResumePrinters(options: {
  interval?: number;
  printerNames?: string[];
  onResume?: (printerName: string) => void;
  onError?: (error: Error) => void;
} = {}): () => void {
  const {
    interval = 1000,
    printerNames,
    onResume,
    onError,
  } = options;

  let isRunning = true;

  const check = async () => {
    if (!isRunning) return;

    try {
      // Get printers to check
      let printersToCheck: Printer[];

      if (printerNames && printerNames.length > 0) {
        // Check specific printers
        const allPrinters = await getAllPrinters();
        printersToCheck = allPrinters.filter(p => printerNames.includes(p.name));
      } else {
        // Check all USB printers by default
        printersToCheck = await getUSBPrinters();
      }

      // Check each printer
      for (const printer of printersToCheck) {
        const isEnabled = await isPrinterEnabled(printer.name);

        if (!isEnabled) {
          await enablePrinter(printer.name);
          if (onResume) {
            onResume(printer.name);
          }
        }
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Schedule next check
    if (isRunning) {
      setTimeout(check, interval);
    }
  };

  // Start the watcher
  check();

  // Return stop function
  return () => {
    isRunning = false;
  };
}
