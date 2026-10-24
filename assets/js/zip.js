async function createZip(files) {
    const encoder = new TextEncoder();

    const localHeaders = [];
    const centralHeaders = [];

    let offset = 0;

    const now = new Date();

    const dosTime =
        (now.getHours() << 11) |
        (now.getMinutes() << 5) |
        (now.getSeconds() >> 1);

    const dosDate =
        ((now.getFullYear() - 1980) << 9) |
        ((now.getMonth() + 1) << 5) |
        now.getDate();

    for (const file of files) {
        const nameBytes = encoder.encode(file.name);

        const crc = crc32(file.data);

        const compressedData = await deflateRaw(file.data);

        const compressedSize = compressedData.length;
        const originalSize = file.data.length;

        // Local File Header
        const lh = new Uint8Array(
            30 + nameBytes.length + compressedSize
        );

        writeU32(lh, 0, 0x04034b50);
        writeU16(lh, 4, 20);
        writeU16(lh, 6, 0);

        // Deflate
        writeU16(lh, 8, 8);

        writeU16(lh, 10, dosTime);
        writeU16(lh, 12, dosDate);

        writeU32(lh, 14, crc);

        writeU32(lh, 18, compressedSize);
        writeU32(lh, 22, originalSize);

        writeU16(lh, 26, nameBytes.length);
        writeU16(lh, 28, 0);

        lh.set(nameBytes, 30);
        lh.set(compressedData, 30 + nameBytes.length);

        localHeaders.push(lh);

        // Central Directory Header
        const ch = new Uint8Array(
            46 + nameBytes.length
        );

        writeU32(ch, 0, 0x02014b50);

        writeU16(ch, 4, 20); // version made by
        writeU16(ch, 6, 20); // version needed

        writeU16(ch, 8, 0);

        // Deflate
        writeU16(ch, 10, 8);

        writeU16(ch, 12, dosTime);
        writeU16(ch, 14, dosDate);

        writeU32(ch, 16, crc);

        writeU32(ch, 20, compressedSize);
        writeU32(ch, 24, originalSize);

        writeU16(ch, 28, nameBytes.length);
        writeU16(ch, 30, 0);
        writeU16(ch, 32, 0);
        writeU16(ch, 34, 0);
        writeU16(ch, 36, 0);

        writeU32(ch, 38, 0);
        writeU32(ch, 42, offset);

        ch.set(nameBytes, 46);

        centralHeaders.push(ch);

        offset += lh.length;
    }

    let centralDirSize = 0;

    for (const ch of centralHeaders) {
        centralDirSize += ch.length;
    }

    const centralDirOffset = offset;

    // End Of Central Directory
    const eocd = new Uint8Array(22);

    writeU32(eocd, 0, 0x06054b50);

    writeU16(eocd, 4, 0);
    writeU16(eocd, 6, 0);

    writeU16(eocd, 8, files.length);
    writeU16(eocd, 10, files.length);

    writeU32(eocd, 12, centralDirSize);
    writeU32(eocd, 16, centralDirOffset);

    writeU16(eocd, 20, 0);

    const totalSize =
        offset +
        centralDirSize +
        eocd.length;

    const zip = new Uint8Array(totalSize);

    let p = 0;

    for (const lh of localHeaders) {
        zip.set(lh, p);
        p += lh.length;
    }

    for (const ch of centralHeaders) {
        zip.set(ch, p);
        p += ch.length;
    }

    zip.set(eocd, p);

    return zip;
}

async function deflateRaw(data) {
    const cs = new CompressionStream('deflate-raw');

    const writer = cs.writable.getWriter();

    await writer.write(data);
    await writer.close();

    const compressed =
        await new Response(cs.readable).arrayBuffer();

    return new Uint8Array(compressed);
}

function writeU16(buf, off, value) {
    buf[off] = value & 0xFF;
    buf[off + 1] = (value >>> 8) & 0xFF;
}

function writeU32(buf, off, value) {
    buf[off] = value & 0xFF;
    buf[off + 1] = (value >>> 8) & 0xFF;
    buf[off + 2] = (value >>> 16) & 0xFF;
    buf[off + 3] = (value >>> 24) & 0xFF;
}