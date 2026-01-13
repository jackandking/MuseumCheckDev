# 博物馆数据采集 7 步法（可复用流程）

面向：批量为博物馆补齐 KV Store + Meta 数据（建筑图 + 3 件镇馆之宝）。

## 快速执行清单
1) 官方核验（必做）
- `node tools/verify-museum-official.js "<馆名>" --verbose`
- 通过标准：Normal 模式 ≥80%（简化名可接受）；严格模式需 100%。记录 official name、省份、等级。 

2) KV 现有数据检查
- `node - <<'NODE'
const fetch = globalThis.fetch;
const endpoint='https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
const key='museum-data-<id>'; const sortKey='museum';
const url=`${endpoint}?key=${encodeURIComponent(key)}&sortKey=${encodeURIComponent(sortKey)}`;
(async()=>{const r=await fetch(url);console.log('Status',r.status);console.log((await r.text()).slice(0,1000));})();
NODE`
- 若 200 且有 value：解析检查 image/collections；若 404/未找到，进入采集。

3) 建筑图片
- 先 Wikimedia：`node tools/search-museum-images-wikimedia.js "<馆名>"`
- 选 1 张代表性外观图；用 HEAD 校验（8s 超时）：
```
node - <<'NODE'
const fetch=globalThis.fetch, url='<image-url>', t=8000;
const c=new AbortController();const id=setTimeout(()=>c.abort(),t);
fetch(url,{method:'HEAD',signal:c.signal}).then(r=>{console.log(r.status,r.ok?'OK':'FAIL');}).catch(e=>console.log('ERR',e.message)).finally(()=>clearTimeout(id));
NODE
```
- 如果 Wikimedia 多次 404/429，再用 Letmetry `image/search` 或百度。

4) 3 件镇馆之宝图片
- 关键字：`<宝物名> <馆名> 高清`（中英可混合）；调用 Letmetry：
```
const res = await fetch('https://letmetry.cloud/image/search', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({keyword:'...',count:5})});
```
- 结果可能是字符串或对象：`const url = typeof img==='string'? img : (img.url||img.imageUrl||img.thumbnail||img.link);`
- 对每个候选做 HEAD 校验（同上）。首个 200 OK 即收录。

5) URL 全量校验
- 建筑 + 3 宝物共 4 个 URL，逐个 HEAD 200 OK。失败则换源重试。

6) 写入 KV Store（保持 key/sortKey 一致）
- 结构示例：
```
const data={ id:'<id>', name:'<name>', location:'<city>', image:'<building-url>', collections:[
  {name:'宝物1', imageUrl:'<url1>', description:'…'},
  {name:'宝物2', imageUrl:'<url2>', description:'…'},
  {name:'宝物3', imageUrl:'<url3>', description:'…'}
]};
fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:`museum-data-${data.id}`,sortKey:'museum',value:JSON.stringify(data),expireAt:4866674732})});
```
- 任何改动都用同一 sortKey='museum'，否则读写不一致。

7) 更新 Meta（data/museums-meta.json）
- 补全 `image`（与建筑图一致）
- `hasCollections` 设为 true
- 使用 apply_patch 或编辑器修改。避免根目录新建 markdown。

## 判定与回退策略
- 官方核验 <80%：停止，先确认馆名；80-99%：可用但记录官方全称；=100%：直接继续。
- 图片 404/429：更换来源（Wikimedia → Letmetry/Baidu），必要时换关键词（外观/正门/夜景）。
- KV 写入后立刻读回检查：确保字段完整、URL 未截断。
- Meta 与 KV 必须同源（同一批 URL）。

## 常用占位与命名
- KV key：`museum-data-<id>`；sortKey 固定 `museum`
- 典型 id：forbidden-city, national-museum, shanghai-museum, sichuan-museum, guangdong-museum

## 失败分支速查
- 找不到建筑图：换关键词（“外观”“正门”“exterior”），或用百度图；仍无则记录待补。
- 镇馆之宝无图：尝试中文/英文/别名，多关键词；必要时降级使用同类展品高清图，标记待替换。
- HEAD 超时：增大超时到 8-10s 或直接 GET 验证；若仍失败，换源。

## 完成后检查
- KV 读回值字段齐全；4 张图 HEAD=200
- Meta 对应条目 `image` 非空且为 https
- hasCollections=true

## 快速模板（复制可用）
- 官方核验：`node tools/verify-museum-official.js "<馆名>" --verbose`
- KV 读：`node -e "const f=fetch;const u='https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore?key=museum-data-<id>&sortKey=museum';(async()=>{const r=await f(u);console.log(await r.text())})();"`
- 图片 HEAD：见步骤 3/5 代码块
- KV 写：见步骤 6 代码块

## 已验证案例（可参考字段与描述）
- 故宫博物院、国家博物馆、上海博物馆、四川博物院、广东省博物馆

保留此文档后，按“快速执行清单”逐项勾选即可复用。