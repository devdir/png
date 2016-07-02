function endianness () {
	var b = new ArrayBuffer(4);
	var a = new Uint32Array(b);
	var c = new Uint8Array(b);
	a[0] = 0xdeadbeef;
	if (c[0] == 0xef) return 'LE';
	if (c[0] == 0xde) return 'BE';
	throw new Error('unknown endianness');
}

class Stream {
	constructor(file) {
		var self = this;
		this._file = file;
		this._length = file.size;
		this._position = 0;
		this._endianness = endianness();
		this._reader = new FileReaderSync();
	}

	get position() {
	  	return this._position;
	}

	set position(value) {
	  	if (value > this._length - 1) {
	  		throw { message: "too far" };
	  	} else if (value < 0) {
	  		throw { message: "too low" };
	  	}
	  	this._position = value;
	}

	get EOF() {
		return this._position >= this._length;
	}

	* bits() {
		var buffer = this.getBlobBytes(this._position, this._length - this._position);
		var position = 0;
		while(position < buffer.length << 3) {
			yield buffer[position >> 3] & (1 << (position & 7));
			position++;
		}
	}

	getBlob(position, length) {
		if (position + length > this._length) {
			debugger;
			throw { message: "passed end" };
		}
		return this._file.slice(position, position + length);
	}

	getBlobBytes(position, length) {
		var blob = this.getBlob(position, length);
		var data = this._reader.readAsArrayBuffer(blob);
		return new Uint8Array(data);
	}

	readBytes(count) {
		var result = this.getBlobBytes(this._position, count);
		this._position += count;
		return result;
	}

	readByte() {
		return this.readBytes(1)[0];
	}

	readUint32(buffer, offset) {
		buffer = buffer || this.readBytes(4);
		offset = offset || 0;
		if (offset + 4 > buffer.length)
			throw { message: "read pas end" };
		if (this._endianness == 'LE') {
			return ((buffer[offset + 0] << 24) +
				    (buffer[offset + 1] << 16) +
				    (buffer[offset + 2] <<  8) +
				    (buffer[offset + 3] <<  0)) >>> 0;
		} else {
			return ((buffer[offset + 3] << 24) +
				    (buffer[offset + 2] << 16) +
				    (buffer[offset + 1] <<  8) +
				    (buffer[offset + 0] <<  0)) >>> 0;
		}
	}

	readUint16(buffer, offset) {
		// TODO for GIF reverse endianess
		buffer = buffer || this.readBytes(2);
		offset = offset || 0;
		if (offset + 2 > buffer.length)
			throw { message: "read pas end" };
		if (this._endianness == 'LE') {
			return ((buffer[offset + 1] <<  8) +
				    (buffer[offset + 0] <<  0)) >>> 0;
		} else {
			return ((buffer[offset + 0] <<  8) +
				    (buffer[offset + 1] <<  0)) >>> 0;
		}
	}	
}