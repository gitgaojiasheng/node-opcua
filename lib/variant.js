var factories = require("./factories");
var s = require("./structures");
var ec = require("./encode_decode");
var DataValue = require("./datavalue").DataValue;


var DataType_Description = {
    name:"DataType",
    isEnum: true,
    enumValues: {
        Null:              0,
        Boolean:           1,
        SByte:             2,
        Byte :             3,
        Int16:             4,
        UInt16:            5,
        Int32:             6,
        UInt32:            7,
        Int64:             8,
        UInt64:            9,
        Float:            10,
        Double:           11,
        String:           12,
        DateTime:         13,
        Guid:             14,
        ByteString:       15,
        XmlElement:       16,
        NodeId:           17,
        ExpandedNodeId:   18,
        StatusCode:       19,
        QualifiedName:    20,
        LocalizedText:    21,
        ExtensionObject:  22,
        DataValue:        23,
        Variant:          24,
        DiagnosticInfo:   25
    }
};
var DataType = exports.DataType = factories.UAObjectFactoryBuild(DataType_Description);

var VariantArrayType_Description = {
    name:"VariantArrayType",
    isEnum: true,
    enumValues: {
        Scalar: 0x00,
        Array:  0x01,
        Matrix:  0x02
    }
};

var VariantArrayType = exports.VariantArrayType = factories.UAObjectFactoryBuild(VariantArrayType_Description);

var QualifiedName   = s.QualifiedName;
var LocalizedText   = s.LocalizedText;
var ExtensionObject = s.ExtensionObject;
var DiagnosticInfo = s.DiagnosticInfo;


function _self_encode(value,stream) {
    return value.encode(stream);
}
function _self_decode(Type) {

    return function(stream) {
        var value = new Type();
        return value.decode(stream);
    }
}




factories.UAObjectFactoryBuild({name:"DateTime"    ,subtype:"UtcTime"});

var _encoder_map = {
    Null:             { encoder : function(){} , decoder: function(){return "null"; } },
    Boolean:          { encoder : ec.encodeBoolean,   decoder: ec.decodeBoolean   },
    SByte:            { encoder : ec.encodeByte,      decoder: ec.decodeByte      },
    Byte :            { encoder : ec.encodeByte,      decoder: ec.decodeByte      },
    Int16:            { encoder : ec.encodeInt16,     decoder: ec.decodeInt16     },
    UInt16:           { encoder : ec.encodeUInt16,    decoder: ec.decodeUInt16    },
    Int32:            { encoder : ec.encodeInt32,     decoder: ec.decodeInt32     },
    UInt32:           { encoder : ec.encodeUInt32,    decoder: ec.decodeUInt32    },
    Int64:            { encoder : ec.encodeInt64,     decoder: ec.decodeInt64     },
    UInt64:           { encoder : ec.encodeUInt64,    decoder: ec.decodeUInt64    },
    Float:            { encoder : ec.encodeFloat,     decoder: ec.decodeFloat     },
    Double:           { encoder : ec.encodeDouble,    decoder: ec.decodeDouble    },
    String:           { encoder : ec.encodeUAString,  decoder: ec.decodeUAString  },
    DateTime:         { encoder : ec.encodeDateTime,  decoder: ec.decodeDateTime  },
    Guid:             { encoder : ec.encodeGUID,      decoder: ec.decodeGUID      },
    ByteString:       { encoder : ec.encodeByteString,decoder: ec.decodeByteString},
    XmlElement:       { encoder : ec.encodeXmlElement,decoder: ec.decodeXmlElement},
    NodeId:           { encoder : ec.encodeNodeId,          decoder: ec.decodeNodeId              },
    ExpandedNodeId:   { encoder : ec.encodeExpandedNodeId,   decoder: ec.encodeExpandedNodeId     },
    StatusCode:       { encoder : ec.encodeUInt32,           decoder: ec.decodeUInt32        },
    QualifiedName:    { encoder : _self_encode,     decoder:  _self_decode(QualifiedName)    },
    LocalizedText:    { encoder : _self_encode,     decoder:  _self_decode(LocalizedText)    },
    ExtensionObject:  { encoder : _self_encode,     decoder:  _self_decode(ExtensionObject)  },
    DataValue:        { encoder : _self_encode,     decoder:  _self_decode(DataValue)        },
    Variant:          { encoder : _self_encode,     decoder:  _self_decode(Variant)          },
    DiagnosticInfo:   { encoder : _self_encode,     decoder:  _self_decode(DiagnosticInfo)   }
};



var Variant_ArrayMask            = 0x80;
var Variant_ArrayDimensionsMask  = 0x40;
var Variant_TypeMask             = 0x3F;


var Variant_Description = {
    name: "Variant",
    id: factories.next_available_id(),
    fields:[
        { name: "dataType" ,  fieldType:"DataType" ,        defaultValue: DataType.Null },
        { name: "arrayType" , fieldType:"VariantArrayType", defaultValue: VariantArrayType.Scalar },
        { name: "value",      fieldType:"UInt32" ,          defaultValue: "null"}
    ],
    encode: function(variant,stream){
        var encodingByte = variant.dataType.value;

        if (variant.arrayType ===  VariantArrayType.Array ) {

            encodingByte = encodingByte | Variant_ArrayMask;
        }
        ec.encodeUInt8(encodingByte,stream);
        var encoder = _encoder_map[variant.dataType.key].encoder;

        if (variant.arrayType ===  VariantArrayType.Array ) {
            var arr = variant.value || [];
            ec.encodeUInt32(arr.length,stream);
            arr.forEach(function(el){
                encoder(el,stream);
            });
        } else {
            encoder(variant.value,stream);
        }
    },

    decode: function(self,stream){
        var encodingByte = ec.decodeUInt8(stream);
        var isArray      = (( encodingByte & Variant_ArrayMask  ) === Variant_ArrayMask);
        var dimension    = (( encodingByte & Variant_ArrayDimensionsMask  ) === Variant_ArrayDimensionsMask);

        self.dataType = DataType.get(encodingByte & Variant_TypeMask);
        var decoder = _encoder_map[self.dataType.key].decoder;

        if (isArray) {
            self.arrayType =VariantArrayType.Array ;

            var length = ec.decodeUInt32(stream);
            var arr = [];
            for (var i = 0; i< length ; i++ ) {
                arr.push(decoder(stream));
            }
            self.value = arr;
        } else {
            self.arrayType =VariantArrayType.Scalar ;
            self.value = decoder(stream);
        }
    }

};


var Variant = exports.Variant = factories.UAObjectFactoryBuild(Variant_Description);