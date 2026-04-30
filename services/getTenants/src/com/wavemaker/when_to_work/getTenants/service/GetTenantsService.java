package com.wavemaker.when_to_work.getTenants.service;


import com.wavemaker.when_to_work.getTenants.model.*;
import com.wavemaker.when_to_work.getTenants.model.ResponseRootResponseROOTEntryItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetTenantsService {

  /**
   * 
   * 
    * @param Authorization Authorization (optional)
   * @return List&lt;ResponseRootResponseROOTEntryItem&gt;
   */
  @RequestLine("GET /tenants")
  @Headers({
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  List<ResponseRootResponseROOTEntryItem> invoke(@Param("Authorization") String Authorization);

}
