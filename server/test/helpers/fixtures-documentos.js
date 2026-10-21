import { deflateRawSync } from 'node:zlib';
import { crc32 } from '../../upload-documentos.js';

export const pdf=Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
// JPEG/PNG 1x1 gerados com System.Drawing, sem arquivos pessoais.
export const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY/j///9/AAn7A/0FQ0XKAAAAAElFTkSuQmCC','base64');
export const jpeg=Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q==','base64');
export function zip(entradas,compactar=false){
    const locais=[],centrais=[];let offset=0;
    for(const [nome,valor] of Object.entries(entradas)){
        const n=Buffer.from(nome),data=Buffer.from(valor),payload=compactar?deflateRawSync(data):data,crc=crc32(data),local=Buffer.alloc(30),central=Buffer.alloc(46);
        local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(compactar?8:0,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(payload.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(n.length,26);
        central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(compactar?8:0,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(payload.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(n.length,28);central.writeUInt32LE(offset,42);
        locais.push(local,n,payload);centrais.push(central,n);offset+=30+n.length+payload.length;
    }
    const diretorio=Buffer.concat(centrais),fim=Buffer.alloc(22);fim.writeUInt32LE(0x06054b50);fim.writeUInt16LE(Object.keys(entradas).length,8);fim.writeUInt16LE(Object.keys(entradas).length,10);fim.writeUInt32LE(diretorio.length,12);fim.writeUInt32LE(offset,16);return Buffer.concat([...locais,diretorio,fim]);
}
export const entradasDocx={
    '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml':'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/></w:body></w:document>'
};
export const docx=zip(entradasDocx,true);
export function cfbDoc(mini=false){
    const total=mini?5:11,b=Buffer.alloc(total*512),E=0xfffffffe,F=0xffffffff;
    Buffer.from('d0cf11e0a1b11ae1','hex').copy(b);b.writeUInt16LE(0x003e,24);b.writeUInt16LE(3,26);b.writeUInt16LE(0xfffe,28);b.writeUInt16LE(9,30);b.writeUInt16LE(6,32);b.writeUInt32LE(1,44);b.writeUInt32LE(1,48);b.writeUInt32LE(4096,56);b.writeUInt32LE(mini?3:E,60);b.writeUInt32LE(mini?1:0,64);b.writeUInt32LE(E,68);for(let p=76;p<512;p+=4)b.writeUInt32LE(F,p);b.writeUInt32LE(0,76);
    for(let p=512;p<1024;p+=4)b.writeUInt32LE(F,p);b.writeUInt32LE(0xfffffffd,512);b.writeUInt32LE(E,516);
    const entrada=(p,n,t,inicio,tamanho)=>{b.write(n+'\0',p,'utf16le');b.writeUInt16LE((n.length+1)*2,p+64);b[p+66]=t;b[p+67]=1;for(const k of [68,72,76])b.writeUInt32LE(F,p+k);b.writeUInt32LE(inicio,p+116);b.writeBigUInt64LE(BigInt(tamanho),p+120);};
    entrada(1024,'Root Entry',5,mini?2:E,mini?512:0);b.writeUInt32LE(1,1024+76);entrada(1152,'WordDocument',2,mini?0:2,mini?64:4096);
    if(mini){b.writeUInt32LE(E,520);b.writeUInt32LE(E,524);for(let p=2048;p<2560;p+=4)b.writeUInt32LE(F,p);b.writeUInt32LE(E,2048);}
    else for(let i=2;i<10;i++)b.writeUInt32LE(i===9?E:i+1,512+i*4);
    b.writeUInt16LE(0xa5ec,1536);b.writeUInt16LE(0xc1,1538);return b;
}
export const doc=cfbDoc();
export const formatos={pdf,doc,docx,jpg:jpeg,jpeg,png};
