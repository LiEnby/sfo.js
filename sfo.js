
function readUint8(array)
{
	byt = array[ofset];
	ofset+=1;
	return byt;
}

function readUint32(array)
{
	var Arr = new Uint8Array([0,0,0,0]);
	for(var i = 0; i < 4; i++)
	{
		Arr[i] = array[ofset];
		ofset++;
	}
	uint = new Uint32Array(Arr.buffer)[0]
	return uint;
}

function readUint32At(array,offset)
{
	var Arr = new Uint8Array([0,0,0,0]);
	for(var i = 0; i < 4; i++)
	{
		Arr[i] = array[offset+i];
	}
	uint = new Uint32Array(Arr.buffer)[0]
	return uint;
}

function readUint16(array)
{
	var Arr = new Uint8Array([0,0]);
	for(var i = 0; i < 2; i++)
	{
		Arr[i] = array[ofset];
		ofset++;
	}
	uint = new Uint16Array(Arr.buffer)[0]
	return uint;
}


function readStringLen(array, length)
{
	var Arr = new Uint8Array(length);
	for(var i = 0; i < length; i++)
	{
		Arr[i] = readUint8(array);
	}
	
	return new TextDecoder("utf-8").decode(Arr);
}

function readStringLenAt(array, length,offset)
{
	var Arr = new Uint8Array(length);
	for(var i = 0; i < length; i++)
	{
		Arr[i] = array[offset+i];
	}
	
	return new TextDecoder("utf-8").decode(Arr);
}

function readStringAt(array, offset)
{
	//First work out how long until \x00
	for(var length = 0; ; length++)
	{
		by = array[offset+length];
		if(by == 0x00)
		{
			break;
		}
	}
	
	//Read the string
	return readStringLenAt(array,length,offset)
}

function parse_sfo(sfoBytes)
{
	ofset = 0;
	
	var uint8Arr = new Uint8Array(sfoBytes)
	
	var SfoHeader = {
		"magic":readUint32(uint8Arr),
		"version":readUint32(uint8Arr),
		"keyofs":readUint32(uint8Arr),
		"valofs":readUint32(uint8Arr),
		"count":readUint32(uint8Arr)
	}
	
	var PSF_TYPE_BIN = 0;
	var PSF_TYPE_STR = 2;
	var PSF_TYPE_VAL = 4;
	
	if(SfoHeader.magic == 0x46535000) //\x00PSF
	{
			
		var SfoEntries = []
		var SfoTable = {}
		for(var i = 0; i < SfoHeader.count; i++)
		{
			var SfoEntry = {
				"nameofs":readUint16(uint8Arr),
				"alignment":readUint8(uint8Arr),
				"type":readUint8(uint8Arr),
				"valsize":readUint32(uint8Arr),
				"totalsize":readUint32(uint8Arr),
				"dataofs":readUint32(uint8Arr)
			}
			SfoEntries = SfoEntries.concat(SfoEntry);
			
		}
		
		
		for(var ii = 0; ii < SfoEntries.length; ii++)
		{
			var keyOffset = SfoHeader.keyofs + SfoEntries[ii].nameofs;
			var keyName = readStringAt(uint8Arr, keyOffset)
			
			var valOffset = SfoHeader.valofs + SfoEntries[ii].dataofs;
			var value = "Unknown Type"
			
			if(SfoEntries[ii].type == PSF_TYPE_STR)
			{
				value = readStringAt(uint8Arr, valOffset)
			}
			else if(SfoEntries[ii].type == PSF_TYPE_VAL)
			{
				value = readUint32At(PSF_TYPE_VAL);
			}
			else if(SfoEntries[ii].type == PSF_TYPE_BIN)
			{
				var Arr = new Uint8Array(SfoEntries[ii].valsize)
				for(var iii = 0; iii < Arr.length; iii++)
				{
					Arr[iii] = uint8Arr[valOffset+iii];
				}
				value = Arr
			}
			
			SfoTable[keyName] = value;
		}

		return SfoTable;
	}
	else
	{
		alert("Invalid param.sfo.");
	}
}