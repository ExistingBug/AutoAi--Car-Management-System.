"""
AutoAI India v3 — Model Engine
KNN-based car recommendation with expanded feature set
"""
import pickle, os, warnings
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics.pairwise import euclidean_distances
warnings.filterwarnings("ignore")
from dataset import get_dataframe

CITY_PROFILES = {
    "Mumbai":     {"min_gc":180,"flood_risk":True, "compact":True, "highway":False},
    "Delhi":      {"min_gc":170,"flood_risk":False,"compact":False,"highway":True},
    "Bangalore":  {"min_gc":185,"flood_risk":True, "compact":True, "highway":False},
    "Chennai":    {"min_gc":175,"flood_risk":True, "compact":False,"highway":False},
    "Hyderabad":  {"min_gc":185,"flood_risk":False,"compact":False,"highway":True},
    "Pune":       {"min_gc":190,"flood_risk":False,"compact":False,"highway":True},
    "Kolkata":    {"min_gc":170,"flood_risk":True, "compact":True, "highway":False},
    "Ahmedabad":  {"min_gc":165,"flood_risk":False,"compact":False,"highway":True},
    "Jaipur":     {"min_gc":175,"flood_risk":False,"compact":False,"highway":True},
    "Chandigarh": {"min_gc":160,"flood_risk":False,"compact":False,"highway":True},
    "Kochi":      {"min_gc":180,"flood_risk":True, "compact":True, "highway":False},
    "Lucknow":    {"min_gc":175,"flood_risk":False,"compact":False,"highway":True},
    "Other City": {"min_gc":175,"flood_risk":False,"compact":False,"highway":False},
}

FUEL_MAP        = {"petrol":0,"diesel":1,"hybrid":2,"electric":3,"cvt":4,"dcr":4}
TRANSMISSION_MAP= {"manual":0,"automatic":1,"cvt":1,"dcr":1}
SEGMENT_MAP     = {"hatchback":0,"sedan":1,"compact_suv":2,"midsize_suv":3,"large_suv":4,"mpv":5,"luxury_suv":6}
BRAND_MAP       = {"japanese":0,"korean":1,"indian":2,"european":3,"american":4,"chinese":5}

FEATURE_COLS = [
    "price_lakh","mileage_kmpl","ground_clearance_mm","boot_space_l",
    "power_bhp","torque_nm","seating","kerb_weight_kg","turning_radius_m",
    "city_friendly","highway","offroad","family","sporty","luxury","budget",
    "resale_value","service_ease","safety_rating","infotainment_score",
    "sunroof","adas","warranty_years","airbags",
    "abs_ebd","parking_sensors","cruise_control","wireless_charging",
    "fuel_enc","trans_enc","segment_enc","brand_enc",
]

def train_and_save(path="model/autoai_model.pkl"):
    df = get_dataframe()
    df["fuel_enc"]    = df["fuel"].map(FUEL_MAP).fillna(0)
    df["trans_enc"]   = df["transmission"].map(TRANSMISSION_MAP).fillna(0)
    df["segment_enc"] = df["segment"].map(SEGMENT_MAP).fillna(2)
    df["brand_enc"]   = df["brand_origin"].map(BRAND_MAP).fillna(2)

    X = df[FEATURE_COLS].fillna(0).astype(float)
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    knn = NearestNeighbors(n_neighbors=min(15, len(df)), metric="euclidean")
    knn.fit(X_scaled)

    bundle = {"knn":knn,"scaler":scaler,"df":df,"feature_cols":FEATURE_COLS,
              "city_profiles":CITY_PROFILES,"fuel_map":FUEL_MAP,
              "transmission_map":TRANSMISSION_MAP,"segment_map":SEGMENT_MAP,
              "brand_map":BRAND_MAP}
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path,"wb") as f: pickle.dump(bundle,f)
    print(f"Model trained on {len(df)} cars ({len(FEATURE_COLS)} features) → {path}")
    return bundle

def _build_query(user_input, bundle):
    df   = bundle["df"]
    scaler = bundle["scaler"]
    cols = bundle["feature_cols"]

    bmin = float(user_input.get("budget_min",0))
    bmax = float(user_input.get("budget_max",100))
    row = {}
    row["price_lakh"]         = (bmin+bmax)/2
    row["fuel_enc"]           = bundle["fuel_map"].get(user_input.get("fuel","petrol"),0)
    row["trans_enc"]          = bundle["transmission_map"].get(user_input.get("transmission",""),0.5)
    row["segment_enc"]        = bundle["segment_map"].get(user_input.get("segment",""),2)
    row["brand_enc"]          = bundle["brand_map"].get(user_input.get("brand_origin",""),2)
    row["seating"]            = int(user_input.get("seating",5))
    row["warranty_years"]     = int(user_input.get("warranty_years",0))

    # Priority-driven specs
    priority = user_input.get("priority","balanced")
    pmap = {
        "mileage":      {"mileage_kmpl":df.mileage_kmpl.max(), "power_bhp":df.power_bhp.median()},
        "performance":  {"power_bhp":df.power_bhp.max(), "torque_nm":df.torque_nm.max()},
        "comfort":      {"boot_space_l":df.boot_space_l.max(),"infotainment_score":5},
        "offroad":      {"ground_clearance_mm":df.ground_clearance_mm.max(),"power_bhp":df.power_bhp.quantile(.75)},
        "safety":       {"safety_rating":5,"airbags":df.airbags.max(),"adas":1},
        "technology":   {"infotainment_score":5,"adas":1,"wireless_charging":1,"sunroof":1},
        "luxury":       {"infotainment_score":5,"sunroof":1,"adas":1,"luxury":1},
        "balanced":     {},
    }
    for k,v in pmap.get(priority,{}).items():
        row[k] = v

    # Boolean filters as scored features
    use_cases = user_input.get("use_case",[])
    row["city_friendly"]= 1 if "city"    in use_cases else 0
    row["highway"]      = 1 if "highway" in use_cases else 0
    row["offroad"]      = 1 if "offroad" in use_cases else 0
    row["family"]       = 1 if "family"  in use_cases else 0
    row["sporty"]       = 1 if "sporty"  in use_cases else 0
    row["luxury"]       = 1 if "luxury"  in use_cases else 0
    row["budget"]       = 1 if bmax<=15  else 0

    # Explicit feature requirements
    for feat in ["sunroof","adas","parking_sensors","cruise_control","wireless_charging","abs_ebd"]:
        val = user_input.get(feat, None)
        if val is not None:
            row[feat] = int(val)

    row.setdefault("mileage_kmpl",      df.mileage_kmpl.median())
    row.setdefault("ground_clearance_mm",df.ground_clearance_mm.median())
    row.setdefault("boot_space_l",      df.boot_space_l.median())
    row.setdefault("power_bhp",         df.power_bhp.median())
    row.setdefault("torque_nm",         df.torque_nm.median())
    row.setdefault("kerb_weight_kg",    df.kerb_weight_kg.median())
    row.setdefault("turning_radius_m",  df.turning_radius_m.median())
    row.setdefault("resale_value",      3)
    row.setdefault("service_ease",      3)
    row.setdefault("safety_rating",     3)
    row.setdefault("infotainment_score",3)
    row.setdefault("sunroof",           0)
    row.setdefault("adas",              0)
    row.setdefault("airbags",           4)
    row.setdefault("abs_ebd",           1)
    row.setdefault("parking_sensors",   0)
    row.setdefault("cruise_control",    0)
    row.setdefault("wireless_charging", 0)
    row.setdefault("warranty_years",    2)

    vec = np.array([row.get(c, df[c].median() if c in df else 0) for c in cols]).reshape(1,-1)
    return scaler.transform(vec)

def recommend(user_input, bundle, top_n=3):
    df   = bundle["df"].copy()
    city = user_input.get("city","Other City")
    cp   = bundle["city_profiles"].get(city, bundle["city_profiles"]["Other City"])

    bmin = float(user_input.get("budget_min",0))
    bmax = float(user_input.get("budget_max",100))
    fuel = user_input.get("fuel","any").lower()
    seg  = user_input.get("segment","")
    seat = int(user_input.get("seating",1))
    want_sunroof = user_input.get("sunroof")
    want_adas    = user_input.get("adas")
    want_wireless= user_input.get("wireless_charging")
    want_cruise  = user_input.get("cruise_control")
    min_safety   = int(user_input.get("min_safety_rating",0))
    min_airbags  = int(user_input.get("min_airbags",0))
    min_warranty = int(user_input.get("warranty_years",0))

    # ── Hard filters ──────────────────────────────────────────────────────
    mask = (df["price_lakh"] >= bmin) & (df["price_lakh"] <= bmax)
    if fuel != "any": mask &= (df["fuel"] == fuel)
    if seg:           mask &= (df["segment"] == seg)
    if seat > 1:      mask &= (df["seating"] >= seat)
    if want_sunroof:  mask &= (df["sunroof"] == 1)
    if want_adas:     mask &= (df["adas"] == 1)
    if want_wireless: mask &= (df["wireless_charging"] == 1)
    if want_cruise:   mask &= (df["cruise_control"] == 1)
    if min_safety>0:  mask &= (df["safety_rating"] >= min_safety)
    if min_airbags>0: mask &= (df["airbags"] >= min_airbags)
    if min_warranty>0:mask &= (df["warranty_years"] >= min_warranty)

    filtered = df[mask].copy()
    if len(filtered) < top_n:  # relax if too few
        mask2 = (df["price_lakh"] >= bmin) & (df["price_lakh"] <= bmax*1.2)
        if fuel!="any": mask2 &= (df["fuel"]==fuel)
        filtered = df[mask2].copy()
    if filtered.empty: filtered = df.copy()

    # ── City GC boost ─────────────────────────────────────────────────────
    filtered["gc_score"] = (filtered["ground_clearance_mm"] >= cp["min_gc"]).astype(float)

    # ── KNN distance ──────────────────────────────────────────────────────
    qvec    = _build_query(user_input, bundle)
    X_filt  = bundle["scaler"].transform(filtered[bundle["feature_cols"]].fillna(0).astype(float))
    dists   = euclidean_distances(qvec, X_filt)[0]
    filtered = filtered.copy()
    filtered["knn_dist"] = dists

    # ── Composite score ───────────────────────────────────────────────────
    maxd = filtered["knn_dist"].max() + 1e-9
    filtered["score"] = 1 - filtered["knn_dist"]/maxd
    filtered["score"] += filtered["gc_score"] * 0.12
    filtered["score"] += (filtered["resale_value"]/5) * 0.08
    filtered["score"] += (filtered["service_ease"]/5) * 0.05
    filtered["score"] += (filtered["safety_rating"]/5) * 0.07
    filtered["score"] += (filtered["infotainment_score"]/5) * 0.04

    priority = user_input.get("priority","balanced")
    if priority=="mileage":
        mx = filtered["mileage_kmpl"].max()+1e-9
        filtered["score"] += (filtered["mileage_kmpl"]/mx)*0.18
    elif priority=="performance":
        mx = filtered["power_bhp"].max()+1e-9
        filtered["score"] += (filtered["power_bhp"]/mx)*0.18
    elif priority=="offroad":
        mx = filtered["ground_clearance_mm"].max()+1e-9
        filtered["score"] += (filtered["ground_clearance_mm"]/mx)*0.18
    elif priority=="safety":
        filtered["score"] += (filtered["safety_rating"]/5)*0.18
        filtered["score"] += (filtered["airbags"]/filtered["airbags"].max())*0.1
    elif priority=="technology":
        filtered["score"] += (filtered["infotainment_score"]/5)*0.12
        filtered["score"] += filtered["adas"]*0.08
    elif priority=="luxury":
        filtered["score"] += filtered["sunroof"]*0.06
        filtered["score"] += (filtered["infotainment_score"]/5)*0.08

    top = filtered.nlargest(top_n,"score")
    results=[]
    for _,row in top.iterrows():
        gc_ok = row["ground_clearance_mm"] >= cp["min_gc"]
        results.append({
            "name":                row["name"],
            "segment":             row["segment"].replace("_"," ").title(),
            "fuel":                row["fuel"].title(),
            "price_lakh":          round(row["price_lakh"],1),
            "mileage_kmpl":        row["mileage_kmpl"],
            "ground_clearance_mm": int(row["ground_clearance_mm"]),
            "boot_space_l":        int(row["boot_space_l"]),
            "power_bhp":           int(row["power_bhp"]),
            "torque_nm":           int(row["torque_nm"]),
            "seating":             int(row["seating"]),
            "transmission":        row["transmission"].title(),
            "safety_rating":       int(row["safety_rating"]),
            "airbags":             int(row["airbags"]),
            "sunroof":             bool(row["sunroof"]),
            "adas":                bool(row["adas"]),
            "infotainment_score":  int(row["infotainment_score"]),
            "warranty_years":      int(row["warranty_years"]),
            "wireless_charging":   bool(row["wireless_charging"]),
            "cruise_control":      bool(row["cruise_control"]),
            "parking_sensors":     bool(row["parking_sensors"]),
            "resale_value":        int(row["resale_value"]),
            "service_ease":        int(row["service_ease"]),
            "brand_origin":        row["brand_origin"].title(),
            "score":               round(float(row["score"])*100, 1),
            "city_note":           _city_note(row, city, cp, gc_ok),
            "highlights":          _highlights(row),
        })
    return results

def _highlights(row):
    hl=[]
    if row["fuel"]=="electric": hl.append("⚡ Zero-emission EV")
    elif row["mileage_kmpl"]>=22: hl.append(f"⛽ {row['mileage_kmpl']} kmpl — outstanding mileage")
    elif row["mileage_kmpl"]>=18: hl.append(f"⛽ {row['mileage_kmpl']} kmpl — great efficiency")
    if row["ground_clearance_mm"]>=200: hl.append(f"🛞 {int(row['ground_clearance_mm'])}mm — excellent road clearance")
    elif row["ground_clearance_mm"]>=180: hl.append(f"🛞 {int(row['ground_clearance_mm'])}mm clearance")
    if row["power_bhp"]>=150: hl.append(f"🏎️ {int(row['power_bhp'])} bhp / {int(row['torque_nm'])} Nm — powerful")
    elif row["power_bhp"]>=100: hl.append(f"🚗 {int(row['power_bhp'])} bhp / {int(row['torque_nm'])} Nm")
    if row["safety_rating"]==5: hl.append(f"🛡️ 5-star safety · {int(row['airbags'])} airbags")
    elif row["safety_rating"]>=4: hl.append(f"🛡️ {int(row['safety_rating'])}-star safety · {int(row['airbags'])} airbags")
    if row["sunroof"]: hl.append("🌤️ Panoramic/electric sunroof")
    if row["adas"]: hl.append("🤖 ADAS — lane assist, auto-braking")
    if row["wireless_charging"]: hl.append("🔋 Wireless charging")
    if row["resale_value"]==5: hl.append("📈 Top resale value in segment")
    if row["service_ease"]==5: hl.append("🔧 Pan-India service network")
    if row["warranty_years"]>=5: hl.append(f"📋 {int(row['warranty_years'])}-year warranty")
    return hl[:6]

def _city_note(row, city, cp, gc_ok):
    gc=int(row["ground_clearance_mm"])
    if cp["flood_risk"]:
        return (f"✅ {gc}mm clearance handles {city}'s monsoon flooding well." if gc_ok
                else f"⚠️ {gc}mm may struggle on flooded {city} roads — drive cautiously during monsoon.")
    elif cp["highway"]:
        return f"🛣️ {int(row['power_bhp'])} bhp & {int(row['torque_nm'])} Nm — great for {city}'s expressways."
    elif cp["compact"]:
        seg=row["segment"]
        if any(x in seg for x in ["hatchback","sedan","compact"]):
            return f"🏙️ Compact size fits {city}'s narrow lanes and tight parking well."
        else:
            return f"⚠️ Larger body — maneuver carefully in {city}'s narrow streets."
    else:
        return f"🏙️ Solid all-round choice suited to {city}'s road mix."

if __name__=="__main__":
    b=train_and_save()
    tests=[
        {"budget_min":8,"budget_max":16,"fuel":"petrol","seating":5,"priority":"safety",
         "use_case":["city","family"],"city":"Mumbai","segment":"compact_suv",
         "min_safety_rating":4,"min_airbags":4},
        {"budget_min":15,"budget_max":25,"fuel":"any","seating":5,"priority":"technology",
         "use_case":["city","luxury"],"city":"Bangalore","sunroof":True,"adas":True,"wireless_charging":True},
        {"budget_min":10,"budget_max":20,"fuel":"electric","seating":5,"priority":"balanced",
         "use_case":["city"],"city":"Delhi"},
    ]
    for i,t in enumerate(tests,1):
        res=recommend(t,b)
        print(f"\n=== Test {i} ===")
        for r in res: print(f"  {r['name']} | ₹{r['price_lakh']}L | Score:{r['score']}% | Safety:{r['safety_rating']}★ | Airbags:{r['airbags']} | ADAS:{r['adas']}")
