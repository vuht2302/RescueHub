using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class vung_phu_trach
{
    public Guid id { get; set; }

    public Guid? parent_id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? zone_type_code { get; set; }

    public MultiPolygon? geom { get; set; }

    public Guid? responsible_don_vi_id { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<vung_phu_trach> Inverseparent { get; set; } = new List<vung_phu_trach>();

    public virtual ICollection<doi_cuu_ho> doi_cuu_hos { get; set; } = new List<doi_cuu_ho>();

    public virtual vung_phu_trach? parent { get; set; }

    public virtual don_vi? responsible_don_vi { get; set; }
}
