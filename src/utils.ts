export function findTextAndReturnRemainder(target: string, start: string, end: string) {
  let result = target.substring(
    target.search(start) + start.length,
    target.search(end)
  );
  result = result.substring(0, result.lastIndexOf(";"));
  return result;
}

export function checkHtmlTag(htmlStr: string) {
  const reg = /<[^>]+>/g;
  return reg.test(htmlStr);
}

export function getTextInHtmlTag(str: string) {
  if (checkHtmlTag(str)) {
    return str.replace(/<[^>]+>/g, "");
  } else {
    return str;
  }
}

export function printImageDownloadLog(str: string) {
  console.log("Now Download: "+str)
}

export async function downloadImage(imgUrl: string) {
  const response = await fetch(imgUrl);
  printImageDownloadLog(imgUrl);
  const blob = await response.blob();
  return blob.arrayBuffer();
}

