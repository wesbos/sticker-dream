import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const execAsync = promisify(exec);

// Detect platform (including WSL)
const isWSL = process.platform === "linux" && (process.env.WSL_DISTRO_NAME !== undefined || process.env.WSLENV !== undefined);
const isWindows = os.platform() === "win32" || isWSL;
const isMac = os.platform() === "darwin";
const isLinux = os.platform() === "linux" && !isWSL;


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
 * Get a list of all available printers on Windows using PowerShell
 * @returns Array of printer objects
 */
async function getAllPrintersWindows(): Promise<Printer[]> {
  try {
    const psCommand = isWSL ? "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" : "powershell.exe";
    const command = `${psCommand} -Command "Get-Printer | Select-Object Name, PrinterStatus, PortName, DriverName, Shared, Published | ConvertTo-Json"`;
    const { stdout } = await execAsync(command);

    const printersData = JSON.parse(stdout);
    const printers = Array.isArray(printersData) ? printersData : [printersData];

    return printers.map((p: any) => ({
      name: p.Name,
      uri: p.PortName || "",
      status: p.PrinterStatus || "unknown",
      isDefault: false, // We'll determine this separately
      isUSB: p.PortName && (p.PortName.includes("USB") || p.PortName.includes("USBPRINT")),
      description: `${p.DriverName || "Unknown driver"} - Status: ${p.PrinterStatus || "Unknown"}`,
    }));
  } catch (error) {
    throw new Error(
      `Failed to get Windows printers: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get the default printer on Windows
 * @returns Default printer name or null
 */
async function getDefaultPrinterWindows(): Promise<string | null> {
  try {
    const psCommand = isWSL ? "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" : "powershell.exe";
    const command = `${psCommand} -Command "Get-WmiObject -Query \\"select Name from Win32_Printer where Default=True\\" | Select-Object -ExpandProperty Name"`;
    const { stdout } = await execAsync(command);
    return stdout.trim() || null;
  } catch (error) {
    console.warn("Could not get default printer:", error);
    return null;
  }
}

/**
 * Get a list of all available printers
 * Supports Windows (including WSL), macOS, and Linux
 * @returns Array of printer objects
 */
export async function getAllPrinters(): Promise<Printer[]> {
  if (isWindows) {
    const printers = await getAllPrintersWindows();
    const defaultPrinter = await getDefaultPrinterWindows();

    return printers.map(p => ({
      ...p,
      isDefault: p.name === defaultPrinter
    }));
  }

  // macOS/Linux CUPS implementation
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
 * Cross-platform support for Windows, macOS, and Linux
 * @param printerName Name of the printer
 * @returns True if printer is enabled and accepting jobs
 */
export async function isPrinterEnabled(printerName: string): Promise<boolean> {
  try {
    if (isWindows) {
      const psCommand = isWSL ? "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" : "powershell.exe";
      const command = `${psCommand} -Command "Get-Printer -Name '${printerName}' | Select-Object -ExpandProperty PrinterStatus"`;
      const { stdout } = await execAsync(command);
      const status = stdout.trim().toLowerCase();

      // In Windows, "normal" means the printer is ready
      return status === "normal" || status === "idle";
    } else {
      // macOS/Linux CUPS implementation
      const { stdout } = await execAsync(`lpstat -p "${printerName}"`);

      // Check for disabled/paused states
      const isDisabled =
        stdout.toLowerCase().includes("disabled") ||
        stdout.toLowerCase().includes("paused");

      return !isDisabled;
    }
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
 * Cross-platform support for Windows, macOS, and Linux
 * @param printerName Name of the printer to enable
 * @returns Success message
 */
export async function enablePrinter(printerName: string): Promise<string> {
  try {
    if (isWindows) {
      // On Windows, try to resume if paused
      const psCommand = isWSL ? "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" : "powershell.exe";
      const command = `${psCommand} -Command "Resume-Printer -Name '${printerName}'"`;
      await execAsync(command);
      return `Printer "${printerName}" has been resumed and is now accepting jobs`;
    } else {
      // macOS/Linux CUPS implementation
      // Enable/resume the printer using cupsenable
      await execAsync(`cupsenable "${printerName}"`);

      // Also accept jobs (in case it was rejecting)
      await execAsync(`cupsaccept "${printerName}"`);

      return `Printer "${printerName}" has been enabled and is now accepting jobs`;
    }
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
 * Print on Windows using PowerShell
 */
async function printImageWindows(
  printerName: string,
  imagePath: string,
  options: PrintOptions = {}
): Promise<string> {
  // Convert path for Windows if needed - use the actual temp file path
  const windowsPath = imagePath.startsWith("/tmp/")
    ? imagePath.replace("/tmp/", "C:\\temp\\")
    : imagePath.replace(/\//g, "\\");

  // Create the temp directory if it doesn't exist
  try {
    const tempDir = "C:\\temp";
    await execAsync(`mkdir "${tempDir}" 2>nul || echo "Directory exists"`);
  } catch (error) {
    // Ignore errors, directory might already exist
  }

  // Copy image file to Windows temp location for cross-platform access
  try {
    await execAsync(`mkdir -p /mnt/c/temp`);
    const fileName = path.basename(imagePath);
    const targetPath = `/mnt/c/temp/${fileName}`;
    await execAsync(`cp "${imagePath}" "${targetPath}"`);
  } catch (error) {
    throw new Error(`Failed to copy image file: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Use .NET PrintDocument optimized for thermal printers
  const scriptContent = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$printerName = "${printerName}"
$imagePath = "${windowsPath}"


# Check if printer exists
$printer = Get-Printer -Name $printerName -ErrorAction SilentlyContinue
if (-not $printer) {
    throw "Printer '$printerName' not found"
}


# Check if image file exists
if (-not (Test-Path $imagePath)) {
    throw "Image file not found: $imagePath"
}

try {
    # Use .NET PrintDocument with thermal printer optimizations
    $printDoc = New-Object System.Drawing.Printing.PrintDocument
    $printDoc.PrinterSettings.PrinterName = $printerName

    # Set black and white printing
    $printDoc.DefaultPageSettings.Color = $false

    $printDoc.add_PrintPage({
        param($sender, $e)

        $image = [System.Drawing.Image]::FromFile($imagePath)

        # Get page dimensions
        $pageWidth = $e.PageBounds.Width
        $pageHeight = $e.PageBounds.Height

        # Calculate scaling to fit page while maintaining aspect ratio
        $scaleX = $pageWidth / $image.Width
        $scaleY = $pageHeight / $image.Height
        $scale = [Math]::Min($scaleX, $scaleY)

        $newWidth = [int]($image.Width * $scale)
        $newHeight = [int]($image.Height * $scale)

        # Center the image
        $x = [int](($pageWidth - $newWidth) / 2)
        $y = [int](($pageHeight - $newHeight) / 2)

        # Draw image with high quality rendering for thermal printing
        $e.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $e.Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $e.Graphics.DrawImage($image, $x, $y, $newWidth, $newHeight)

        $image.Dispose()
    })

    $printDoc.Print()
    $printDoc.Dispose()

    Write-Output "Print job submitted to $printerName"

} catch {
    Write-Output "Error: $($_.Exception.Message)"
    throw $_
}
`;

  // Write script to temp file in a Windows-accessible location
  const timestamp = Date.now();
  const scriptPath = `/tmp/print-script-${timestamp}.ps1`;
  const windowsScriptPath = `C:\\temp\\print-script-${timestamp}.ps1`;

  await fs.promises.writeFile(scriptPath, scriptContent);

  // Copy script to Windows location for PowerShell execution
  try {
    await execAsync(`mkdir -p /mnt/c/temp`);
    await execAsync(`cp "${scriptPath}" "/mnt/c/temp/print-script-${timestamp}.ps1"`);
  } catch (error) {
    throw new Error(`Failed to copy script to Windows location: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const psExe = isWSL ? "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" : "powershell.exe";
    const command = `${psExe} -ExecutionPolicy Bypass -File "${windowsScriptPath}"`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes("Install the latest PowerShell")) {
      console.warn("PowerShell warnings:", stderr);
    }

    // Clean up script files
    try {
      await fs.promises.unlink(scriptPath);
      await fs.promises.unlink(`/mnt/c/temp/print-script-${timestamp}.ps1`);
    } catch (e) { /* ignore */ }

    return stdout.trim() || "Print job submitted";
  } catch (error) {
    // Clean up script files
    try {
      await fs.promises.unlink(scriptPath);
      await fs.promises.unlink(`/mnt/c/temp/print-script-${timestamp}.ps1`);
    } catch (e) { /* ignore */ }

    throw new Error(
      `Windows printing failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Build the print command with options (Unix/Linux/macOS)
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
 * Cross-platform support with optimizations for thermal printers on Windows
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

    let jobId: string;

    if (isWindows) {
      // Use Windows PowerShell printing
      const result = await printImageWindows(printerName, imagePath, options);
      jobId = result;
    } else {
      // Use CUPS/lp for macOS/Linux
      const command = buildPrintCommand(printerName, imagePath, options);
      const { stdout } = await execAsync(command);

      // Extract job ID from output
      // Output format: "request id is PrinterName-JobID (1 file(s))"
      const jobMatch = stdout.match(/request id is .+-(\d+)/);
      jobId = jobMatch ? jobMatch[1] : stdout.trim();
    }

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
